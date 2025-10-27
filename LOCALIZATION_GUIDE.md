# Localization Guide - Indonesian & English Support

## 📝 Overview

The website now supports **Indonesian** (id) and **English** (en) languages with full internationalization (i18n) infrastructure.

**Default Language:** Indonesian 🇮🇩

## 🎯 What Was Implemented

### 1. **i18n Infrastructure** (`src/lib/i18n/`)
- **Type definitions** (`types.ts`) - TypeScript types for locales
- **Core utility** (`index.ts`) - Translation functions and locale management
- **Client-side handler** (`client.ts`) - Automatic translation on page load and language switch
- **Translation files** (`locales/en.json`, `locales/id.json`) - Complete translations for both languages

### 2. **Language Switcher**
- Added to the main navigation header in `Layout.astro`
- Users can switch between English and Indonesian
- Selection persists in localStorage

### 3. **Updated Components**
- ✅ `Layout.astro` - Navigation, language switcher
- ✅ `index.astro` - Home page
- ✅ `CourseCard.astro` - Course cards
- ✅ `courses/index.astro` - Course listing
- ✅ `admin/index.astro` - Admin dashboard
- ✅ `auth/signin.astro` - Sign in page

## 🚀 How to Use

### For Users
1. **Select Language**: Use the dropdown in the top-right navigation
2. **Language Persists**: Your choice is saved in browser localStorage
3. **All Pages Updated**: Navigation, buttons, labels, and content automatically translate

### For Developers
1. **Add Translations to Components**:
   ```html
   <h1 data-i18n="home.welcomeTitle">Welcome to My Learning Portal</h1>
   ```

2. **Add Translation Keys**:
   ```json
   {
     "home": {
       "welcomeTitle": "Selamat Datang di Portal Pembelajaran Saya"
     }
   }
   ```

3. **Translate Placeholders**:
   ```html
   <input 
     placeholder="Email address" 
     data-i18n-placeholder="auth.emailAddress"
   />
   ```

### Current Translation Coverage
- ✅ Navigation menu
- ✅ Home page
- ✅ Course listing
- ✅ Sign in page
- ✅ Admin dashboard
- ✅ Common buttons and actions
- ✅ Admin course creation
- ✅ Chapter creation
- ✅ Language switcher (Indonesian selected by default)

## 📋 Translation Keys Structure

```
translations/
├── common        # Common UI elements
├── nav           # Navigation
├── auth          # Authentication pages
├── home          # Home page
├── courses       # Course pages
├── admin         # Admin dashboard
├── admin.courses # Course management
└── errors        # Error messages
```

## 🛠️ Adding More Translations

### Step 1: Update JSON files
Add keys to both `locales/en.json` and `locales/id.json`:

**English** (`locales/en.json`):
```json
{
  "admin.chapters": {
    "addNewChapter": "Add New Chapter"
  }
}
```

**Indonesian** (`locales/id.json`):
```json
{
  "admin.chapters": {
    "addNewChapter": "Tambah Bab Baru"
  }
}
```

### Step 2: Add to components
```html
<h1 data-i18n="admin.chapters.addNewChapter">Add New Chapter</h1>
```

## 🌐 How It Works

1. **Client-side translation**: Uses JavaScript to translate elements on page load
2. **data-i18n attribute**: Mark translatable elements with this attribute
3. **Automatic switching**: Language switcher triggers page re-translation
4. **Persistence**: User's language choice saved in localStorage

## 📝 Indonesian Translation Notes

- Used formal Indonesian ("Anda" instead of "kamu")
- Technical terms kept as-is (e.g., "Markdown", "LaTeX")
- Educational terminology properly translated
- Culturally appropriate phrasing

## ✅ Current Status

All major pages are fully translated with Indonesian as the default language:
- ✅ All navigation elements
- ✅ All admin pages (courses, chapters creation)
- ✅ Authentication pages  
- ✅ Course browsing pages
- ✅ Indonesian is the default language on first visit

**Note:** Dynamic content (actual course titles, descriptions, and chapter content) can be added in Indonesian by administrators when creating courses.

## 🐛 Troubleshooting

**Translation not appearing?**
- Check the translation key exists in both `en.json` and `id.json`
- Ensure the `data-i18n` attribute is correctly set
- Check browser console for JavaScript errors

**Language not switching?**
- Clear browser localStorage and try again
- Check that `client.ts` is loaded in `Layout.astro`

**Missing translations?**
- Add the key to both `en.json` and `id.json`
- Ensure proper nesting (e.g., `"admin.courses.title"`)

## 📚 Files Changed

- `src/lib/i18n/` - New i18n infrastructure
- `src/components/Layout.astro` - Added language switcher
- `src/pages/index.astro` - Home page translations
- `src/pages/courses/index.astro` - Course listing translations
- `src/pages/admin/index.astro` - Admin dashboard translations
- `src/pages/auth/signin.astro` - Sign in translations
- `src/components/CourseCard.astro` - Course card translations

---

**Happy Localizing!** 🎉

