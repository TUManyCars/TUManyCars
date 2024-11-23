import subprocess

def run_command(command):
    subprocess.run(command, check=True, shell=True)

def restart_containers():
    run_command('docker-compose down')
    run_command('docker-compose up -d')

if __name__ == "__main__":
    restart_containers()