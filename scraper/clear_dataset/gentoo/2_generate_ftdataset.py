import json

# Cargar datos procesados de Gentoo
with open("gentoo_clean.jsonl", "r", encoding="utf-8") as f:
    data = [json.loads(line) for line in f]

# Filtrar y construir pares pregunta-respuesta
output = []
for item in data:
    pregunta = item.get("ask", "").strip()
    respuesta = item.get("correct_answer", "")
    
    # Solo si hay una respuesta válida
    if pregunta and respuesta:
        output.append({
            "prompt": pregunta,
            "completion": respuesta
        })

# Guardar como JSONL para fine-tuning
with open("gentoo_finetune_data.jsonl", "w", encoding="utf-8") as f:
    for entry in output:
        json.dump(entry, f, ensure_ascii=False)
        f.write("\n")

print(f"✔ gentoo_finetune_data.jsonl generado: {len(output)} pares pregunta-respuesta creados.")