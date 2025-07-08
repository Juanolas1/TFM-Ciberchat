#!/usr/bin/env python3
"""
extrae_lineas_jsonl.py

Lee un JSONL y copia las N primeras líneas a otro JSONL.

Uso:
    python extrae_lineas_jsonl.py \
        --entrada gentoo_finetune_data.jsonl \
        --salida gentoo_finetune_data_6491.jsonl \
        --max-lines 6491
"""

import argparse
import itertools
import pathlib
import sys


def copiar_jsonl(entrada: pathlib.Path, salida: pathlib.Path, max_lines: int) -> None:
    """Copia las `max_lines` primeras líneas del JSONL de `entrada` a `salida`."""
    with entrada.open("r", encoding="utf‑8") as fin, \
            salida.open("w", encoding="utf‑8") as fout:
        for linea in itertools.islice(fin, max_lines):
            fout.write(linea)
    print(f"✅  Copiadas {max_lines} líneas a {salida}")


def parse_args(argv=None):
    p = argparse.ArgumentParser(description="Extraer las primeras N líneas de un JSONL")
    p.add_argument("--entrada", required=True, type=pathlib.Path,
                   help="Archivo JSONL original")
    p.add_argument("--salida", required=True, type=pathlib.Path,
                   help="Archivo JSONL de salida")
    p.add_argument("--max-lines", default=6491, type=int,
                   help="Número de líneas a copiar (defecto: 6491)")
    return p.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    copiar_jsonl(args.entrada, args.salida, args.max_lines)


if __name__ == "__main__":
    main()
