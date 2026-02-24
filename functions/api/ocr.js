export async function onRequestPost(context) {
  const { request, env } = context;

  let imgSrc;
  try {
    ({ imgSrc } = await request.json());
  } catch {
    return json({ error: 'Geçersiz istek gövdesi.' }, 400);
  }

  if (!imgSrc || !imgSrc.startsWith('data:image/')) {
    return json({ error: 'imgSrc eksik veya geçersiz.' }, 400);
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: 'Sunucu yapılandırma hatası: API anahtarı eksik.' }, 500);
  }

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Bu görseldeki tüm metni oku. Satır satır, düz metin olarak yaz. Başka açıklama ekleme.' },
          { type: 'image_url', image_url: { url: imgSrc } }
        ]
      }],
      max_tokens: 2000
    })
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    return json({ error: err.error?.message || 'OpenAI API hatası: ' + upstream.status }, 502);
  }

  const data = await upstream.json();
  const text = data.choices?.[0]?.message?.content || '';
  return json({ text });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
