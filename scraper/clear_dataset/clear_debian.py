import subprocess
import os

def ejecutar_script(ruta_script):
    print(f"Ejecutando {ruta_script}...")
    resultado = subprocess.run(["python", ruta_script], capture_output=True, text=True)
    
    if resultado.returncode != 0:
        print(f"Error al ejecutar {ruta_script}:")
        print(resultado.stderr)
        exit(1)
    else:
        print(f"{ruta_script} ejecutado correctamente.")
        print(resultado.stdout)

if __name__ == "__main__":
    carpeta = "debian"
    scripts = [
        "1_preprocess_data.py",
        "2_generate_correct_answer.py",
        "3_generate_ftdataset.py"
    ]
    
    for script in scripts:
        ruta_completa = os.path.join(carpeta, script)
        ejecutar_script(ruta_completa)
