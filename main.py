import os
import re
import json
from flask import Flask, render_template, request, redirect, url_for, jsonify
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
import spacy

UPLOAD_FOLDER = 'uploads'
SECRET_KEY = 'super-secret-key-eren'
SOZLUK_PATH = 'sozluk/deu-tur.json'

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = SECRET_KEY

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

nlp = spacy.load("de_core_news_sm")

def load_json_dict():
    with open(SOZLUK_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
DE_TR_DICT = load_json_dict()

def get_meaning_from_dict(word):
    results = [entry for entry in DE_TR_DICT if entry["de"].lower() == word.lower()]
    return results if results else None

def clean_text(text):
    if text is None:
        return ""
    text = re.sub(r"^(\d{1,3})([A-ZÄÖÜa-zäöü][^\s]*)", r"\1 \2", text, flags=re.MULTILINE)
    text = re.sub(r"[\u2028\u2029\u200b]", " ", text)
    return re.sub(r"[^a-zA-Z0-9ÄÖÜäöüßğüşöçıİ.,;:!?\\-–—\'\"()\[\]\{\} \n\r\t]+", "", text)

def extract_pdf_pages(pdf_file_path):
    reader = PdfReader(pdf_file_path)
    pages = []
    for page in reader.pages:
        text = page.extract_text() or ""
        cleaned = clean_text(text)
        wrapped = re.sub(r'(\w+)', r'<span class="word">\1</span>', cleaned)
        pages.append(wrapped.strip())
    return pages

@app.route("/", methods=["GET"])
def index():
    books = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.lower().endswith('.pdf')]
    return render_template("index.html", books=books)

@app.route("/upload", methods=["POST"])
def upload():
    if 'pdf' not in request.files:
        return redirect(url_for('index'))
    file = request.files['pdf']
    if file.filename == '':
        return redirect(url_for('index'))
    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)
    return redirect(url_for('index'))

@app.route("/read/<filename>")
def read(filename):
    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    pages = extract_pdf_pages(pdf_path)
    return render_template("reader.html", book=filename, pages=pages, page_count=len(pages))


@app.route("/reader")
def reader_local():
    return render_template("reader.html", book="Yerel Kitap", pages=[], page_count=1)



@app.route("/customtext", methods=["POST"])
def custom_text():
    text = request.form.get("custom_text", "")
    if not text.strip():
        return redirect(url_for("index"))
    cleaned = clean_text(text)
    wrapped = re.sub(r'(\w+)', r'<span class="word">\1</span>', cleaned)
    pages = [wrapped]
    return render_template("reader.html", book="Manuel Metin", pages=pages, page_count=1)

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    word = data.get("word")
    if not word or not word.strip():
        return jsonify({"error": "Kelime bulunamadı."}), 400

    doc = nlp(word)
    if len(doc) == 0:
        return jsonify({"error": "Kelime analiz edilemedi."}), 400

    token = doc[0]
    lemma = token.lemma_
    pos = token.pos_
    artikel = "der/die/das" if pos == "NOUN" else ""

    anlam_kayitlari = get_meaning_from_dict(word)
    if anlam_kayitlari:
        anlamlar = [", ".join(rec["tr"]) for rec in anlam_kayitlari]
        anlam = "; ".join(anlamlar)
        if "artikel" in anlam_kayitlari[0] and anlam_kayitlari[0]["artikel"]:
            artikel = anlam_kayitlari[0]["artikel"]
    else:
        anlam = "-"

    return jsonify({
        "word": word,
        "lemma": lemma,
        "pos": pos,
        "artikel": artikel,
        "anlam": anlam
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
