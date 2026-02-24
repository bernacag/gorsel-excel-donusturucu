# CLAUDE.md

Bu dosya, Claude Code'un (claude.ai/code) bu depoda çalışırken başvuracağı rehberdir.

## Proje Genel Bakış

**Görsel & İçerik Excel Dönüştürücü** — derleme adımı olmayan, tek dosyadan oluşan bir tarayıcı uygulamasıdır. Görsel, PDF, DOCX ve ZIP dosyalarını kabul eder; görselleri ve metinleri (OCR veya yerel ayrıştırma yoluyla) çıkarır, düzenlenebilir bir tabloda gösterir ve gerçek gömülü görsellerle `.xlsx` dosyası olarak dışa aktarır.

## Çalıştırma

Derleme adımı yoktur. `index.html` doğrudan tarayıcıda açılır:
```
start index.html        # Windows
open index.html         # macOS
```
Tüm bağımlılıklar çalışma zamanında CDN'lerden yüklenir (`node_modules` veya `package.json` yoktur).

## Mimari

Uygulamanın tamamı `index.html` içinde, üç bölümden oluşan tek bir dosyada yer alır:

1. **HTML** — `.hidden` sınıfıyla kontrol edilen, birbirini dışlayan üç UI paneli:
   - `#uploadSection` — sürükle-bırak / dosya seçici giriş ekranı
   - `#progressSection` — ilerleme çubuğu olan işlem göstergesi
   - `#resultSection` — iki satırlı başlıklı tablo ve dışa aktarma butonu

2. **CSS** — Tasarım değerleri CSS özel özellikleriyle (`--green`, `--border` vb.) tanımlanır. Herhangi bir framework kullanılmaz.

3. **JavaScript** — tüm mantık tek bir `<script>` bloğunda yer alır:
   - `tableData[]` — merkezi durum nesnesi: `{ index, label, imgSrc (data URL), textLines[] }`
   - `currentName` — dışa aktarılan `.xlsx` dosyasının temel adı
   - `tessWorker` — tembel başlatılan Tesseract.js çalışanı (Türkçe + İngilizce, ilk kullanımda ~4 MB indirilir)

### Dosya türü yönlendirmesi (`route()` → işleyici)

| Girdi | İşleyici | Metin kaynağı |
|---|---|---|
| `.pdf` | `processPDF()` | `pdf.js` metin katmanı; sayfa canvas'a render edilir → JPEG data URL |
| `.docx`/`.doc` | `processDOCX()` | `mammoth.js` HTML dönüşümü; görseller base64 olarak çıkarılır |
| `.zip` | `processZIP()` | `JSZip`; görsellere OCR uygulanır; aynı isimli `.txt` dosyası varsa OCR atlanır |
| Görsel / klasör | `processImages()` | `Tesseract.js` OCR; aynı isimli `.txt` dosyası varsa OCR atlanır |

### Eşlik eden `.txt` dosyası desteği
Bir görsel ile aynı temel ada sahip `.txt` dosyası bulunursa (`foto.jpg` + `foto.txt`), metin dosyasının içeriği doğrudan kullanılır ve OCR atlanır.

### Excel dışa aktarma (`exportExcel()`)
**ExcelJS** (jsDelivr'den tarayıcı derlemesi) kullanılır. `wb.addImage()` ve `ws.addImage()` ile gömülü görsellerden oluşan veri satırları ve iki satırlı başlık (grup satırı + alt başlık satırı) oluşturulur. Görseller iki başlık satırı nedeniyle `tl: { col:0, row: ri+2 }` ile konumlandırılır.

## CDN Bağımlılıkları

| Kütüphane | Sürüm | Amaç |
|---|---|---|
| pdf.js | 3.11.174 | PDF render ve metin çıkarma |
| mammoth.js | 1.6.0 | DOCX → HTML dönüşümü |
| JSZip | 3.10.1 | ZIP dosyası açma |
| Tesseract.js | 4.x | OCR (Türkçe + İngilizce) |
| ExcelJS | 4.3.0 | Gömülü görsellerle `.xlsx` oluşturma |
