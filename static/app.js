// =================== POPUP (Kelimeye tıklama) ===================
document.addEventListener("DOMContentLoaded", function() {
    const textContent = document.getElementById('text-content');
    const popup = document.getElementById('word-popup');
    const popupContent = document.getElementById('popup-content');

    // Kelimeye tıklama
    textContent.addEventListener('click', async function(event) {
        let target = event.target;
        if (target.classList.contains('word')) {
            const word = target.textContent.trim();
            let response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: word })
            });
            let data = await response.json();

            if(data.error) {
                popupContent.innerHTML = `<span style="color:red;">${data.error}</span>`;
            } else {
                popupContent.innerHTML = `
                    <strong>${data.word}</strong>
                    <span style="color:#aaf;">${data.artikel || ''}</span><br>
                    <em>${data.lemma ? `[${data.lemma}]` : ''}</em><br>
                    <span>${data.anlam || 'Anlam bulunamadı.'}</span>
                `;
            }

            popup.style.display = "none";
            popup.style.opacity = 0;
            const rect = target.getBoundingClientRect();
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const scrollX = window.scrollX || document.documentElement.scrollLeft;
            let top = rect.bottom + scrollY + 6;
            let left = rect.left + scrollX;
            if (left + popup.offsetWidth > window.innerWidth) {
                left = window.innerWidth - popup.offsetWidth - 15;
            }
            if (top + popup.offsetHeight > window.innerHeight + scrollY) {
                top = rect.top + scrollY - popup.offsetHeight - 10;
            }
            popup.style.left = `${left}px`;
            popup.style.top = `${top}px`;
            popup.style.display = "block";
            setTimeout(() => popup.style.opacity = 1, 10);
        } else {
            hidePopup();
        }
    });

    // Popup dışında bir yere tıklayınca kapansın
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#word-popup') && !e.target.classList.contains('word')) {
            hidePopup();
        }
    });

    // Escape ile kapatma
    document.addEventListener('keydown', function(e) {
        if (e.key === "Escape") hidePopup();
    });

    window.hidePopup = function() {
        popup.style.display = "none";
        popup.style.opacity = 0;
    };
});

// =================== FAVORİLER ===================
window.showFavoritesModal = function() {
    let favs = JSON.parse(localStorage.getItem("favoriKelimeler") || "[]");
    let html = favs.length == 0 ? "<div>Hiç favori kelimen yok.</div>" :
      favs.map(f => `
        <div class="fav-list-item">
            <b>${f.kelime}</b> <span class="fav-tag">${f.etiket || ""}</span>
            <div>${f.anlam || ""}</div>
            ${f.not ? `<div class="fav-note">Not: ${f.not}</div>` : ""}
            <button class="btn btn-red" style="margin-top:4px" onclick="window.removeFav('${f.kelime}')">Sil</button>
        </div>
      `).join("");
    const favList = document.getElementById("favorites-list");
    if (favList) favList.innerHTML = html;
    const modal = document.getElementById("favorites-modal");
    if (modal) modal.style.display = "flex";
}

window.removeFav = function(word) {
    let favs = JSON.parse(localStorage.getItem("favoriKelimeler") || "[]");
    favs = favs.filter(f => f.kelime !== word);
    localStorage.setItem("favoriKelimeler", JSON.stringify(favs));
    window.showFavoritesModal();
}

window.clearFavorites = function() {
    if (confirm("Tüm favorileri silmek istediğine emin misin?")) {
        localStorage.setItem("favoriKelimeler", "[]");
        window.showFavoritesModal();
    }
}

window.closeFavoritesModal = function() {
    const modal = document.getElementById("favorites-modal");
    if (modal) modal.style.display = "none";
}

// =================== ALINTILAR ===================
window.getQuotes = function() {
    return JSON.parse(localStorage.getItem("alinanAlintilar") || "[]");
}
window.saveQuotes = function(arr) {
    localStorage.setItem("alinanAlintilar", JSON.stringify(arr));
}
window.showQuotesModal = function() {
    const arr = window.getQuotes();
    const modal = document.getElementById("quotes-modal");
    const list = document.getElementById("quotes-list");
    if (!modal || !list) return;
    let html = arr.length == 0 ? "<div>Henüz alıntı eklemedin.</div>" :
      arr.map(q => `
        <div style="border-bottom:1px solid #eee;padding:7px 0 8px 0;">
            <div style="font-size:1.07em;margin-bottom:7px;">"${q.text}"</div>
            <div style="font-size:.97em;color:#555;">${q.note ? '<b>Not:</b> ' + q.note + '<br>' : ''}<span style="color:#888;font-size:.96em;">${q.date}</span></div>
        </div>
      `).join("");
    list.innerHTML = html;
    modal.style.display = "flex";
}
window.closeQuotesModal = function() {
    const modal = document.getElementById("quotes-modal");
    if (modal) modal.style.display = "none";
}
window.clearQuotes = function() {
    if (confirm("Tüm alıntıları silmek istediğine emin misin?")) {
        window.saveQuotes([]);
        window.closeQuotesModal();
    }
}

// =================== MODAL AÇMA/KAPAMA ===================
document.addEventListener("DOMContentLoaded", function() {
    // Kenar ikonları için
    const quotesBtn = document.getElementById("quotes-btn");
    const bookshelfBtn = document.getElementById("bookshelf-btn");


    if (quotesBtn) quotesBtn.onclick = window.showQuotesModal;
    if (bookshelfBtn) bookshelfBtn.onclick = function() {
    window.location.href = "http://127.0.0.1:5000/";
};



    // Quote bar (seçili metin)
    const addQuoteBtn = document.getElementById("add-quote-btn");
    if (addQuoteBtn) {
        addQuoteBtn.onclick = function() {
            let txt = window.getSelection().toString().trim();
            if (!txt) return;
            let arr = window.getQuotes();
            let note = prompt("Bu alıntı için not eklemek ister misin? (İsteğe bağlı)", "");
            arr.unshift({text: txt, note: note||"", date: new Date().toLocaleString()});
            window.saveQuotes(arr);
            document.getElementById("quote-bar").style.display = "none";
            alert("Alıntı eklendi!");
        };
    }

    // Quote barı göster/gizle
    document.addEventListener("mouseup", function() {
        let txt = window.getSelection().toString().trim();
        let bar = document.getElementById("quote-bar");
        if (bar) {
            if (txt.length > 2) {
                document.getElementById("selected-quote-text").textContent = txt.length > 100 ? txt.substr(0,100)+"..." : txt;
                bar.style.display = "block";
            } else {
                bar.style.display = "none";
            }
        }
    });
});

function handleFileLocal() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file || !file.type.includes("pdf")) {
        alert("Lütfen bir PDF dosyası seçin.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const typedarray = new Uint8Array(e.target.result);

        pdfjsLib.getDocument(typedarray).promise.then(async function(pdf) {
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map(item => item.str).join(" ");
                fullText += strings + "\n\n";
            }
            localStorage.setItem("last_title", file.name);
            localStorage.setItem("last_text", fullText);
            alert("PDF başarıyla yüklendi!");
            window.location.href = "/reader";
        }).catch(function(error) {
            console.error("PDF okuma hatası:", error);
            alert("PDF dosyası okunamadı.");
        });
    };

    reader.readAsArrayBuffer(file); // PDF için özel okuma tipi
}





// =================== MODAL GENEL KAPATICI ===================
window.onclick = function(event) {
    [
        "favorites-modal", "sources-modal", "stats-modal",
        "note-modal", "translate-modal", "quotes-modal", "bookshelf-modal"
    ].forEach(id => {
        let m = document.getElementById(id);
        if (event.target === m) m.style.display = "none";
    });

    // =================== LOCAL STORAGE'DAN METNİ YÜKLE ===================
window.addEventListener('DOMContentLoaded', () => {
    const text = localStorage.getItem('last_text');
    if (text) {
        const container = document.getElementById('textContainer');
        if (container) {
    container.innerHTML = text
        .replace(/\n/g, "<br>")  // Satır sonlarını HTML'de görünür kılar
        .replace(/\b(\w+)\b/g, '<span class="word">$1</span>');  // Kelimeleri span'le sar
}
    }
});

