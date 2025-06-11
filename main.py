from flask import Flask, render_template, request, jsonify
import os
import re

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/reader', methods=['GET', 'POST'])
def reader():
    if request.method == 'POST':
        text = request.form['text']
        words = re.findall(r'\b\w+\b', text)
        return render_template('reader.html', text=text, words=words)
    return render_template('reader.html')

@app.route('/translate', methods=['POST'])
def translate():
    word = request.json['word']
    dictionary = {
        "Haus": "ev",
        "Baum": "ağaç",
        "Katze": "kedi",
        "lesen": "okumak",
        "Buch": "kitap",
        "Raum": "oda",
        "Wort": "kelime",
        "Wasser": "su",
        "sprechen": "konuşmak",
        "denken": "düşünmek"
    }
    translation = dictionary.get(word, "Anlamı bulunamadı")
    return jsonify({"translation": translation})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
