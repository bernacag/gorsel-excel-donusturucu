# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje Genel Bakış

**Görsel & İçerik Excel Dönüştürücü** — derleme adımı olmayan bir tarayıcı uygulamasıdır. Görsel, PDF, DOCX ve ZIP dosyalarını kabul eder; görselleri ve metinleri çıkarır, düzenlenebilir bir tabloda gösterir ve gerçek gömülü görsellerle `.xlsx` dosyası olarak dışa aktarır.

OCR işlemi istemci tarafında değil, **Cloudflare Pages Function** üzerinden GPT-4o Vision API'sine gönderilerek yapılır.

## Çalıştırma

Derleme adımı yoktur. `index.html` doğrudan tarayıcıda açılır:
```
start index.html        # Windows
open index.html         # macOS
```
Tüm ön yüz bağımlılıkları çalışma zamanında CDN'lerden yüklenir (`node_modules` veya `package.json` yoktur).

OCR özelliğinin çalışması için uygulamanın Cloudflare Pages üzerinde dağıtılmış olması ve `OPENAI_API_KEY` ortam değişkeninin ayarlı olması gerekir. Dosyayı yerel olarak doğrudan açarsanız OCR çalışmaz (`.txt` eşlikçi dosyaları yine de çalışır).

## Mimari

Proje iki katmandan oluşur:

### 1. Ön Yüz (`index.html`)

Tek dosyadaki uygulama; HTML, CSS ve JavaScript'ten oluşur:

- **UI panelleri** — `.hidden` sınıfıyla geçiş yapılır: `#uploadSection`, `#progressSection`, `#resultSection`
- **Merkezi durum** — `tableData[]`: `{ index, label, imgSrc (data URL), textLines[] }`
- **`currentName`** — dışa aktarılan `.xlsx` dosyasının temel adı

#### Dosya türü yönlendirmesi (`route()` → işleyici)

| Girdi | İşleyici | Metin kaynağı |
|---|---|---|
| `.pdf` | `processPDF()` | `pdf.js` metin katmanı; sayfa canvas'a render edilir → JPEG data URL |
| `.docx`/`.doc` | `processDOCX()` | `mammoth.js` HTML dönüşümü; görseller base64 olarak çıkarılır |
| `.zip` | `processZIP()` | `JSZip`; görsellere OCR uygulanır; aynı isimli `.txt` varsa OCR atlanır |
| Görsel / klasör | `processImages()` | GPT-4o Vision OCR; aynı isimli `.txt` varsa OCR atlanır |

#### Eşlik eden `.txt` dosyası desteği
Bir görsel ile aynı temel ada sahip `.txt` dosyası bulunursa (`foto.jpg` + `foto.txt`), `.txt` içeriği doğrudan kullanılır ve API çağrısı yapılmaz.

#### Excel dışa aktarma (`exportExcel()`)
**ExcelJS** kullanılır. İki satırlı başlık (grup satırı + alt başlık satırı) oluşturulur; görseller `tl: { col:0, row: ri+2 }` ile konumlandırılır.

### 2. Arka Uç (`functions/api/ocr.js`)

**Cloudflare Pages Function** — `POST /api/ocr` isteğini karşılar.

- İstemciden `{ imgSrc }` (data URL) alır
- `env.OPENAI_API_KEY` ile OpenAI `gpt-4o` Vision API'sine iletir
- Modele "görseldeki tüm metni satır satır, düz metin olarak yaz" talimatı verir
- `{ text }` döndürür

`_routes.json` dosyası, `/api/*` yollarını bu Function'a yönlendirir.

## CDN Bağımlılıkları (Ön Yüz)

| Kütüphane | Sürüm | Amaç |
|---|---|---|
| pdf.js | 3.11.174 | PDF render ve metin çıkarma |
| mammoth.js | 1.6.0 | DOCX → HTML dönüşümü |
| JSZip | 3.10.1 | ZIP dosyası açma |
| ExcelJS | 4.3.0 | Gömülü görsellerle `.xlsx` oluşturma |
