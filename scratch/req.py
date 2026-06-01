import urllib.request
import json
try:
    with urllib.request.urlopen("http://localhost:5000/items?lang=ru", timeout=10) as response:
        data = json.loads(response.read().decode())
        with open("scratch/local_items.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
except Exception as e:
    print("Error:", e)
