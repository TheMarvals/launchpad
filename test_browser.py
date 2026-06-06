import subprocess
import os

# Trying to see if I can launch it manually just to verify if the path is correct
try:
    print("Trying to launch chromium...")
    # Just checking if the file is executable
    if os.access("/usr/bin/chromium-browser", os.X_OK):
        print("Chromium is executable.")
    else:
        print("Chromium is NOT executable.")
except Exception as e:
    print(f"Error: {e}")
