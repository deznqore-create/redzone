# RED ZONE — Static Website

موقع استوديو معماري بسيط (HTML + CSS + JS فقط) — نفس الاستايل، بدون React أو إطار عمل.

## الصفحات

| ملف | الوصف |
|-----|--------|
| `index.html` | الرئيسية |
| `projects.html` | أرشيف المشاريع + فلتر |
| `project.html?slug=...` | تفاصيل مشروع |
| `inspiration.html` | لوحات إلهام |
| `about.html` | عن الاستوديو |
| `contact.html` | تواصل |
| `admin-login.html` | دخول صفحة النشر (المفتاح: `redzone`) |
| `admin.html` | نشر / تعديل / مسودة المشاريع |

## التشغيل محليًا

افتح المجلد بأي سيرفر ثابت، مثلاً:

```bash
npx serve .
# أو
python3 -m http.server 8080
```

ثم افتح http://localhost:8080

## النشر على Vercel / Netlify / GitHub Pages

ارفع محتويات المجلد كما هي. لا يوجد build step.

- **Vercel:** New Project → ارفع المجلد أو اربطه بـ GitHub (Root = هذا المجلد).
- **GitHub Pages:** Settings → Pages → Deploy from branch.

## صفحة النشر

1. ادخل `/admin-login.html`
2. المفتاح الافتراضي: **`redzone`**
3. أضف أو عدّل المشاريع (تُحفظ في المتصفح عبر localStorage)

ملاحظة: بيانات النشر محلية لكل متصفح. للنشر الحقيقي على السيرفر تحتاج لاحقًا ربط بقاعدة بيانات أو CMS.

## اللوجو

`brand/logo.png` — شفاف (بدون خلفية).
