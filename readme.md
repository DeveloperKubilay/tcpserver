# 🔥 TCP-FORWARDER 🔥

![tcp-forwader]()

## YO! What's this awesomeness? ✨

TCP-Forwarder is a FIRE 🔥 tool that lets you expose your local services to the ENTIRE INTERNET! No more "works on my machine" drama! This lightweight TCP tunneling solution is perfect for sharing your localhost projects, testing webhooks, or showing off your work without deploying ANYWHERE!

### How it works

1. Run the server on a publicly accessible machine
2. Connect your client from your local machine
3. BOOM! Your local service is now available through the server! MAGIC! ✨

## Quick Start

### Server Setup
```bash
node serve.js [PORT] [PASSWORD]
```

### Client Setup
```bash
node cli.js [SERVER:PORT] [PASSWORD] [LOCAL_PORT]
```

## Configuration Options (Customize it YOUR way)

### Server (serve.js)
- `PORT`: The port the server listens on (default: 8080)
- `PASSWORD`: Secret password for authentication (default: "pass")

### Client (cli.js)
- `SERVERURL`: Address of the TCP-Forwarder server (format: "host:port")
- `PASSWORD`: Must match the server password
- `SHAREPORT`: Local port you want to expose (default: 80)

## Environment Variables (For the pros)

Can't be bothered with command-line args? Use these environment variables instead:

### Server
- `PORT`: Server listening port
- `PASSWORD`: Authentication password

### Client
- `SERVERURL`: Server address (host:port)
- `PASSWORD`: Authentication password
- `SHAREPORT`: Local port to forward

## Use Cases (Why this is LITERALLY the best)

- Share your local development server with friends
- Test webhooks locally
- Demo your app without deploying
- Bypass NAT/firewall restrictions
- Access home services remotely

---

# 🔥 TCP-FORWARDER 🔥

## HEY! Bu harika şey de ne? ✨

TCP-Forwarder, yerel servislerini TÜM İNTERNETE açmanı sağlayan EFSANE 🔥 bir araç! Artık "benim bilgisayarımda çalışıyor" draması yok! Bu hafif TCP tünelleme çözümü, localhost projelerini paylaşmak, webhook'ları test etmek veya işini HİÇBİR YERE deploy etmeden göstermek için mükemmel!

### Nasıl çalışıyor

1. Sunucuyu herkese açık bir makinede çalıştır
2. İstemciyi yerel makinenden bağla
3. İŞTE BU KADAR! Yerel servisin artık sunucu üzerinden erişilebilir! SİHİR GİBİ! ✨

## Hızlı Başlangıç

### Sunucu Kurulumu
```bash
node serve.js [PORT] [ŞİFRE]
```

### İstemci Kurulumu
```bash
node cli.js [SUNUCU:PORT] [ŞİFRE] [YEREL_PORT]
```

## Yapılandırma Seçenekleri (KENDİ tarzında özelleştir)

### Sunucu (serve.js)
- `PORT`: Sunucunun dinlediği port (varsayılan: 8080)
- `PASSWORD`: Kimlik doğrulama için gizli şifre (varsayılan: "pass")

### İstemci (cli.js)
- `SERVERURL`: TCP-Forwarder sunucusunun adresi (format: "host:port")
- `PASSWORD`: Sunucu şifresiyle eşleşmeli
- `SHAREPORT`: Açmak istediğin yerel port (varsayılan: 80)

## Çevre Değişkenleri (Profesyoneller için)

Komut satırı argümanlarıyla uğraşamıyor musun? Bunun yerine bu çevre değişkenlerini kullan:

### Sunucu
- `PORT`: Sunucu dinleme portu
- `PASSWORD`: Kimlik doğrulama şifresi

### İstemci
- `SERVERURL`: Sunucu adresi (host:port)
- `PASSWORD`: Kimlik doğrulama şifresi
- `SHAREPORT`: Yönlendirilecek yerel port

## Kullanım Senaryoları (Neden bu RESMEN en iyisi)

- Yerel geliştirme sunucunu arkadaşlarınla paylaş
- Webhook'ları yerel olarak test et
- Uygulamanı deploy etmeden demo yap
- NAT/firewall kısıtlamalarını atla
- Ev servislerine uzaktan eriş
