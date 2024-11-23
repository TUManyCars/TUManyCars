import subprocess
import time


def restart_and_wait_for_service(compose_file_path):
    """Restart a Docker service and wait until it's running using 'docker ps'."""
    try:
        subprocess.run(
            [
                "docker-compose",
                "-f",
                compose_file_path,
                "down",
                "--volumes",
                "--remove-orphans",
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        subprocess.run(
            ["docker-compose", "-f", compose_file_path, "up", "-d", "--build"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        print("Restarted all containers.")

    except subprocess.CalledProcessError as e:
        print(f"An error occurred: {e.stderr.decode()}")
        raise RuntimeError("Failed to execute docker-compose commands.")
    time.sleep(15)
