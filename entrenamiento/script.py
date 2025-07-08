#!/usr/bin/env python3
import os, argparse, json
from torch.utils.data import Dataset, DataLoader
from transformers import LlamaForCausalLM, LlamaTokenizer, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from peft import LoraConfig, get_peft_model, TaskType

class JSONDataset(Dataset):
    def __init__(self, file_path, tokenizer, max_length):
        # Carga todo el JSON (suponiendo un array de objetos o JSON por línea)
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                # fallback a JSON por línea
                f.seek(0)
                data = [json.loads(line) for line in f if line.strip()]
        self.examples = data
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        ex = self.examples[idx]
        # Aquí asumo que cada ex tiene 'prompt' y 'completion'
        text = ex['prompt'] + ex['completion']
        tok = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
        )
        # Para causal LM labels = input_ids
        tok['labels'] = tok['input_ids'].copy()
        return tok

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--base_model",   required=True)
    p.add_argument("--train_file",   required=True)
    p.add_argument("--output_dir",   default="/workspace/output")
    p.add_argument("--epochs",       type=int, default=3)
    p.add_argument("--batch-size",   type=int, default=8)
    p.add_argument("--gradient-accum",type=int, default=4)
    p.add_argument("--learning-rate",type=float, default=3e-4)
    p.add_argument("--lora_r",       type=int, default=8)
    p.add_argument("--lora_alpha",   type=int, default=16)
    p.add_argument("--lora_dropout", type=float, default=0.05)
    p.add_argument("--max_length",   type=int, default=1024)
    args = p.parse_args()

    # Carga modelo y tokenizador
    tokenizer = LlamaTokenizer.from_pretrained(args.base_model)
    model = LlamaForCausalLM.from_pretrained(
        args.base_model,
        device_map="auto",
        torch_dtype="auto",
    )

    # Aplica LoRA
    lora_cfg = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        inference_mode=False,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout
    )
    model = get_peft_model(model, lora_cfg)

    # Crea el dataset
    train_dataset = JSONDataset(
        args.train_file,
        tokenizer,
        args.max_length
    )

    data_collator = DataCollatorForLanguageModeling(
        tokenizer,
        mlm=False
    )

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.gradient_accum,
        learning_rate=args.learning_rate,
        fp16=True,
        logging_steps=10,
        save_steps=100,
        save_total_limit=2,
        load_best_model_at_end=True,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        data_collator=data_collator,
    )
    trainer.train()

    model.save_pretrained(os.path.join(args.output_dir, "lora_model"))
    tokenizer.save_pretrained(os.path.join(args.output_dir, "lora_model"))
    print("-> Finetuning completado.")

if __name__=="__main__":
    main()
