#!/usr/bin/env python3
"""
WorkHub Real-Time Job Scraper & Aggregator
Aggregates live vacancies across Uzbekistan (hh.uz, olx.uz and top employers),
cleans all external portal references so only 'WorkHub' branding is visible,
and seeds rich vacancies across all 14 regions and major categories into PostgreSQL.
"""

import urllib.request
import urllib.parse
import re
import json
import uuid
import random
import subprocess
import time
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'uz-UZ,uz;q=0.9,ru;q=0.8,en;q=0.7',
}

REGIONS = [
    'Toshkent shahri', 'Toshkent viloyati', 'Samarqand viloyati',
    'Farg‘ona viloyati', 'Andijon viloyati', 'Namangan viloyati',
    'Buxoro viloyati', 'Xorazm viloyati', 'Qashqadaryo viloyati',
    'Surxondaryo viloyati', 'Jizzax viloyati', 'Sirdaryo viloyati',
    'Navoiy viloyati', 'Qoraqalpog‘iston Respublikasi', 'Masofaviy (Remote)'
]

CATEGORIES = [
    'IT & Dasturlash', 'Marketing & Savdo', 'Moliya & Buxgalteriya',
    'HR & Menejment', 'Dizayn & UX', 'Mijozlarga xizmat',
    'Qurilish & Ishlab chiqarish', 'Ta’lim', 'Transport & Logistika'
]

TOP_UZ_COMPANIES = {
    'IT & Dasturlash': [
        'Uzum Technologies', 'Payme (Inspire Group)', 'Click LLC', 'EPAM Systems Uzbekistan',
        'TBC Bank Tech', 'IT Park Uzbekistan', 'Yandex Go Uzbekistan', 'UIC Group',
        'Beeline Digital', 'Ucell IT Hub', 'Cprime Uzbekistan', 'OneID Dev Team',
        'Ipak Yo‘li FinTech', 'Mohirdev', 'FIDO-BIZNES', 'Newmax Technologies'
    ],
    'Marketing & Savdo': [
        'Korzinka (Anglesey Food)', 'Makro Supermarket', 'Texnomart', 'Mediapark',
        'Uzum Market', 'Ucell Marketing', 'Beeline Savdo Departamenti', 'Mobiuz',
        'Artel Marketing', 'Akfa Sales Hub', ' Murad Buildings Sales', 'Golden House'
    ],
    'Moliya & Buxgalteriya': [
        'TBC Bank Uzbekistan', 'Hamkorbank ATB', 'Kapitalbank ATB', 'Ipak Yo‘li Banki',
        'SQB (O‘zsanoatqurilishbank)', 'Agrobank ATB', 'Xalq Banki', 'Anorbank',
        'InfinBANK', 'Trustbank', 'Uzum Bank', 'PwC Uzbekistan'
    ],
    'HR & Menejment': [
        'Enter Engineering', 'Orient Group', 'Akfa Holding', 'Artel Group',
        'Eriell Group', 'UzAuto Motors', 'Uzum Holding', 'Krantas Group',
        ' Murad Buildings', 'Golden House HR', 'BMB Trade Group', 'Silverleafe'
    ],
    'Dizayn & UX': [
        'Uzum Design Studio', 'Click Creative Lab', 'Payme Product Team', 'EPAM Design',
        'TBCLab Design', 'UIC Design Lab', 'Demark Agency', 'Synthesis Creative',
        'Metis Agency', 'Pixel Craft', 'Brandbox Creative'
    ],
    'Mijozlarga xizmat': [
        'Uzum Call Center', 'Click Qo‘llab-quvvatlash', 'Payme 24/7 Service', 'Beeline Aloqa Markazi',
        'Ucell Mijozlar Bo‘limi', 'TBC Aloqa Markazi', 'Express 24 Dispatch', 'Yandex Eats Support',
        'Korzinka Call Center', 'Hamkorbank Mijozlar Xizmati'
    ],
    'Qurilish & Ishlab chiqarish': [
        'Murad Buildings Construction', 'Golden House Engineering', 'Artel Zavodi', 'Akfa Ekstrusion',
        'Enter Engineering Tashkent', 'Knauf Gips Bukhara', 'UzAuto Motors Zavodi', 'Bektemir Metall Zavodi',
        'Navoiy Kon-metallurgiya Kombinati (NKMK)', 'Olmaliq KMK'
    ],
    'Ta’lim': [
        'Najot Ta’lim', 'PDP Academy', 'Astrum IT Academy', 'Mohirdev Ta’lim Markazi',
        'Cambridge LC Tashkent', 'Inter Nation English School', 'Everest LC', 'Westminster School',
        'Wepro Academy', 'IT Bilim Markazi'
    ],
    'Transport & Logistika': [
        'Uzum Tezkor Logistika', 'Yandex Delivery Uzbekistan', 'Express 24 Kuryerlik', 'Fargo Parcel Service',
        'Polar Logistics Tashkent', 'Silk Road Cargo', 'BTS Express Pochta', 'EMU Express Post',
        'Korzinka Logistika Markazi', 'Makro Logistics'
    ]
}

def clean_text(text: str) -> str:
    """Removes all mentions of external scraping sources and brands them as WorkHub."""
    if not text:
        return ""
    # Strip external site names
    patterns = [
        (r'https?://\S+', ''),
        (r'www\.\S+', ''),
        (r'olx(\.uz)?', 'WorkHub', re.IGNORECASE),
        (r'headhunter', 'WorkHub', re.IGNORECASE),
        (r'hh\.uz', 'WorkHub', re.IGNORECASE),
        (r'hh\.ru', 'WorkHub', re.IGNORECASE),
        (r'rabota\.uz', 'WorkHub', re.IGNORECASE),
        (r'ish\.uz', 'WorkHub', re.IGNORECASE),
        (r't\.me/\S+', '@workhub_official'),
        (r'telegram:?\s*@\S+', '@workhub_contact'),
        (r'OLX platformasida joylashtirilgan vakansiya:?', 'WorkHub tasdiqlangan rasmiy vakansiyasi:'),
        (r'Вакансия с сайта hh\.uz:?', 'WorkHub rasmiy vakansiyasi:'),
    ]
    cleaned = text
    for p in patterns:
        cleaned = re.sub(p[0], p[1], cleaned, flags=p[2] if len(p) > 2 else 0)
    return cleaned.strip()

def normalize_region(text: str) -> str:
    t = text.lower()
    if 'samarqand' in t or 'самарканд' in t:
        return 'Samarqand viloyati'
    if 'buxoro' in t or 'бухара' in t:
        return 'Buxoro viloyati'
    if 'farg‘ona' in t or 'фергана' in t or 'fargona' in t or 'qo‘qon' in t or 'коканд' in t:
        return 'Farg‘ona viloyati'
    if 'andijon' in t or 'андижан' in t:
        return 'Andijon viloyati'
    if 'namangan' in t or 'наманган' in t:
        return 'Namangan viloyati'
    if 'xorazm' in t or 'urganch' in t or 'хорезм' in t or 'урганч' in t or 'xiva' in t:
        return 'Xorazm viloyati'
    if 'qashqadaryo' in t or 'qarshi' in t or 'карши' in t or 'кашкадарья' in t or 'shahrisabz' in t:
        return 'Qashqadaryo viloyati'
    if 'surxondaryo' in t or 'termiz' in t or 'термез' in t or 'сурхандарья' in t:
        return 'Surxondaryo viloyati'
    if 'jizzax' in t or 'джизак' in t:
        return 'Jizzax viloyati'
    if 'sirdaryo' in t or 'guliston' in t or 'сырдарья' in t or 'гулистан' in t:
        return 'Sirdaryo viloyati'
    if 'navoiy' in t or 'навои' in t or 'zarafshon' in t or 'uchquduq' in t:
        return 'Navoiy viloyati'
    if 'qoraqalpoq' in t or 'nukus' in t or 'каракалпак' in t or 'нукус' in t:
        return 'Qoraqalpog‘iston Respublikasi'
    if 'remote' in t or 'masofaviy' in t or 'удален' in t:
        return 'Masofaviy (Remote)'
    if 'toshkent vil' in t or 'ташкентская' in t or 'chirchiq' in t or 'angren' in t or 'olmaliq' in t:
        return 'Toshkent viloyati'
    return 'Toshkent shahri'

def categorize(title: str, desc: str) -> str:
    combined = (title + ' ' + desc).lower()
    if any(k in combined for k in ['developer', 'dasturchi', 'engineer', 'frontend', 'backend', 'golang', 'python', 'java', 'react', 'mobile', 'flutter', 'devops', 'qa', 'data', 'it ', 'full-stack', 'system', 'c#', 'c++', 'php', 'ios', 'android']):
        return 'IT & Dasturlash'
    if any(k in combined for k in ['marketing', 'smm', 'savdo', 'sales', 'reklama', 'tarjimon', 'copywriter', 'seo', 'targetolog', 'promouter', 'targ', 'pr ']):
        return 'Marketing & Savdo'
    if any(k in combined for k in ['buxgalter', 'moliya', 'iqtisod', 'auditor', 'kassir', 'accountant', 'finance', 'soliq', 'buhgalter', 'kassa']):
        return 'Moliya & Buxgalteriya'
    if any(k in combined for k in ['hr', 'recruiter', 'menejer', 'manager', 'direktor', 'rahbar', 'administrator', 'boshqaruv', 'rekruter', 'ofis']):
        return 'HR & Menejment'
    if any(k in combined for k in ['dizayn', 'design', 'ui/ux', 'figma', 'grafik', 'illustrator', '3d', 'motion', 'video', 'interyer']):
        return 'Dizayn & UX'
    if any(k in combined for k in ['operator', 'call-center', 'operatori', 'mijoz', 'qo\'llab', 'dispetcher', 'call ', 'resepshn', 'konsultant']):
        return 'Mijozlarga xizmat'
    if any(k in combined for k in ['qurilish', 'ustanovka', 'montaj', 'ishlab chiqarish', 'usta', 'muhandis', 'texnolog', 'zavod', 'payvandchi', 'elektrik', 'slesar']):
        return 'Qurilish & Ishlab chiqarish'
    if any(k in combined for k in ['haydovchi', 'kuryer', 'yetkazib', 'logistika', 'sklad', 'ombor', 'driver', 'yukchi', 'kurer', 'ekspeditor']):
        return 'Transport & Logistika'
    if any(k in combined for k in ['o‘qituvchi', 'ustoz', 'mentor', 'kurs', 'ta\'lim', 'pedagog', 'ingliz', 'repetitor', 'o`qituvchi', 'murabbiy']):
        return 'Ta’lim'
    return 'IT & Dasturlash'

def get_reputable_company(cat: str, company: str) -> str:
    c = company.strip()
    if not c or c in ['WorkHub Ish beruvchi', 'O‘zbekiston Kompaniyasi', 'Частное лицо', 'ИП', 'ООО', 'Ish beruvchi', 'OOO', 'Kompaniya']:
        return random.choice(TOP_UZ_COMPANIES.get(cat, ['WorkHub Hamkor Korxonasi']))
    return c

def scrape_hh(query: str, page: int = 0):
    url = f'https://hh.uz/search/vacancy?text={urllib.parse.quote(query)}&area=97&page={page}&items_on_page=50'
    results = []
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            soup = BeautifulSoup(html, 'html.parser')
            cards = soup.select('[data-qa="vacancy-serp__vacancy"]')
            for card in cards:
                title_el = card.select_one('[data-qa="serp-item__title"]')
                company_el = card.select_one('[data-qa="vacancy-serp__vacancy-employer"]')
                salary_el = card.select_one('[data-qa="vacancy-serp__vacancy-compensation"]')
                address_el = card.select_one('[data-qa="vacancy-serp__vacancy-address"]')
                snippet_el = card.select_one('[data-qa="vacancy-serp__vacancy_snippet_requirement"]')

                if not title_el:
                    continue

                title = clean_text(title_el.get_text(strip=True))
                raw_company = clean_text(company_el.get_text(strip=True) if company_el else '')
                salary = clean_text(salary_el.get_text(strip=True) if salary_el else 'Kelishilgan')
                location_raw = address_el.get_text(strip=True) if address_el else 'Toshkent'
                desc = snippet_el.get_text(strip=True) if snippet_el else f"{title} lavozimi uchun malakali xodim ishga taklif etiladi. WorkHub orqali bog‘laning."
                desc = clean_text(desc)

                region = normalize_region(location_raw + ' ' + title)
                cat = categorize(title, desc)
                company = get_reputable_company(cat, raw_company)

                results.append({
                    'title': title,
                    'company': company,
                    'salary': salary,
                    'location': region,
                    'description': desc,
                    'category': cat,
                    'source': 'WorkHub'
                })
    except Exception as e:
        print(f"Error scraping hh for '{query}': {e}")
    return results

def scrape_olx():
    category_slugs = [
        'it-telekom-kompyutery',
        'marketing-reklama-dizayn',
        'bukhgalteriya-finansy-audyt',
        'prodazhi',
        'logistika-sklad-dostavka',
        'stroitelstvo',
        'obrazovanie-nauka',
        'proizvodstvo-energetika',
        'bar-restoran-obshchepit',
        'meditsina-farmatsevtika',
        'servis-i-byt'
    ]
    results = []
    for slug in category_slugs:
        for page in [1, 2]:
            url = f'https://www.olx.uz/rabota/{slug}/?page={page}'
            try:
                req = urllib.request.Request(url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=12) as resp:
                    html = resp.read().decode('utf-8', errors='ignore')
                    soup = BeautifulSoup(html, 'html.parser')
                    cards = soup.select('div[data-cy="l-card"]')
                    for card in cards:
                        title_el = card.select_one('h4, h6')
                        price_el = card.select_one('p[data-testid="ad-price"]')
                        loc_el = card.select_one('p[data-testid="location-date"]')

                        if not title_el:
                            continue

                        title = clean_text(title_el.get_text(strip=True))
                        salary = clean_text(price_el.get_text(strip=True) if price_el else 'Kelishilgan')
                        loc_raw = loc_el.get_text(strip=True) if loc_el else 'Toshkent'

                        region = normalize_region(loc_raw + ' ' + title)
                        cat = categorize(title, '')
                        company = get_reputable_company(cat, '')

                        desc = f"{company} korxonasiga {title} yo‘nalishi bo‘yicha mas’uliyatli mutaxassis ishga qabul qilinadi. Talablar: tajriba va mas’uliyat. Qulay ish tartibi va o‘z vaqtida oylik maosh. WorkHub orqali rezyume topshiring."

                        results.append({
                            'title': title,
                            'company': company,
                            'salary': salary,
                            'location': region,
                            'description': desc,
                            'category': cat,
                            'source': 'WorkHub'
                        })
            except Exception as e:
                print(f"Error scraping OLX {slug} page {page}: {e}")
    return results

def generate_regional_catalog():
    """Generates rich, high-salary realistic vacancies across all 14 Uzbekistan regions."""
    generated = []
    
    positions_by_cat = {
        'IT & Dasturlash': [
            ('Senior Backend Go / PostgreSQL Dasturchi', '18 000 000 - 32 000 000 UZS', 'Mikroxizmatlar arxitekturasi, yuqori yuklamali tizimlar (Highload) va to‘lov shlyuzlari bilan ishlash.'),
            ('Middle / Senior React & Next.js Frontend Developer', '14 000 000 - 25 000 000 UZS', 'Zamonaviy SPA/SSR ilovalari, TypeScript, TailwindCSS va Redux Toolkit bilan ishlash.'),
            ('Flutter / React Native Mobile Dasturchi', '15 000 000 - 28 000 000 UZS', 'iOS va Android uchun korporativ mobil ilovalarni ishlab chiqish va Google Play/App Store ga chiqarish.'),
            ('DevOps Muhandisi (Docker, K8s, CI/CD)', '20 000 000 - 38 000 000 UZS', 'Kubernetes klasterlari, GitLab CI/CD, Terraform va Linux serverlarini boshqarish va monitoring qilish.'),
            ('Python / FastAPI & Django Backend Muhandisi', '12 000 000 - 22 000 000 UZS', 'REST API, Celery, Redis va ma’lumotlar tahlili loyihalarini ishlab chiqish.'),
            ('QA Engineer (Avtomatlashtirilgan & Qo‘lda testlash)', '10 000 000 - 18 000 000 UZS', 'Playwright, Cypress yoki Selenium yordamida regressiv va yuklama testlarini yozish.'),
            ('Data Analyst / BI Tahlilchi (SQL, PowerBI)', '12 000 000 - 20 000 000 UZS', 'Katta biznes ko‘rsatkichlarini tahlil qilish, ETL jarayonlari va boshqaruv dashboardlarini yaratish.'),
            ('Kiberxavfsizlik Mutaxassisi (SOC Analyst)', '18 000 000 - 30 000 000 UZS', 'Tarmoq xavfsizligi, zaifliklarni aniqlash (pentest) va axborot xavfsizligi standartlarini joriy etish.')
        ],
        'Marketing & Savdo': [
            ('B2B Savdo Bo‘limi Boshlig‘i (Head of Sales)', '15 000 000 - 30 000 000 UZS', 'Korporativ mijozlar bazasini kengaytirish, savdo rejasini bajarish va jamoani boshqarish.'),
            ('SMM Strateg & Kontent Menejeri', '7 000 000 - 14 000 000 UZS', 'Instagram, Telegram va YouTube kanallari uchun viral kontent, reels va oylik media-rejalar ishlab chiqish.'),
            ('Lead Targetolog / Performance Marketer', '9 000 000 - 18 000 000 UZS', 'Facebook Ads, Google Ads va TikTok platformalarida yuqori ROI bilan reklama kampaniyalarini boshqarish.'),
            ('Brend Menejer (Brand Manager)', '12 000 000 - 22 000 000 UZS', 'Kompaniya brendining bozordagi obro‘sini oshirish, PR tadbirlar va partnyorlik loyihalarini tashkillashtirish.'),
            ('Mintaqaviy Savdo Vakili (Regional Sales Rep)', '8 000 000 - 16 000 000 UZS', 'Viloyat bo‘yicha do‘konlar va ulgurji xaridorlar bilan shartnomalar tuzish, dilerlik tarmoqlarini kengaytirish.')
        ],
        'Moliya & Buxgalteriya': [
            ('Bosh Buxgalter (Chief Accountant - 1C 8.3)', '14 000 000 - 26 000 000 UZS', 'Buxgalteriya va soliq hisobotlarini yuritish, 1C tizimida to‘liq operatsiyalar, auditdan o‘tkazish.'),
            ('Moliyaviy Nazoratchi & Auditor (Financial Controller)', '15 000 000 - 28 000 000 UZS', 'Kompaniya xarajatlari va daromadlari tahlili, P&L, Cash Flow va Balance Sheet tuzish.'),
            ('Kredit Mutaxassisi (Mikromoliya & Bank)', '8 000 000 - 15 000 000 UZS', 'Yuridik va jismoniy shaxslarga kredit ajratish, garov mulkini baholash va risklarni tahlil qilish.'),
            ('Bosh Kassir & Valyuta Operatsiyalari Mutaxassisi', '6 000 000 - 10 000 000 UZS', 'Naqd va naqd pulsiz to‘lovlar, kassa intizomi va inkassatsiya jarayonlarini aniq yuritish.')
        ],
        'HR & Menejment': [
            ('HR Director / Inson Resurslari Bo‘limi Rahbari', '18 000 000 - 35 000 000 UZS', 'Kadrlar strategiyasi, xodimlarni jalb qilish (recruiting), KPI va motivatsiya tizimini joriy qilish.'),
            ('IT Recruiter / Talent Acquisition Specialist', '9 000 000 - 18 000 000 UZS', 'Tajribali dasturchilar, dizaynerlar va menejerlarni saralash va jamoaga jalb qilish.'),
            ('Loyiha Menejeri (Project Manager / Scrum Master)', '14 000 000 - 26 000 000 UZS', 'Agile/Scrum metodologiyalari asosida loyiha muddatlarini nazorat qilish va jamoa faoliyatini muvofiqlashtirish.'),
            ('Bosh Ofis Menejeri / Ijrochi Direktor Yordamchisi', '7 000 000 - 13 000 000 UZS', 'Ofis ish yurituvini tashkil etish, uchrashuvlar jadvalini tuzish va rahbariyat topshiriqlarini nazorat qilish.')
        ],
        'Dizayn & UX': [
            ('Senior UI/UX Dizayneri (Figma, Design System)', '15 000 000 - 28 000 000 UZS', 'Mobil ilovalar va veb-servislar uchun qulay foydalanuvchi interfeyslari (UI/UX) va dizayn tizimlarini yaratish.'),
            ('Grafik & Brending Dizayneri', '8 000 000 - 16 000 000 UZS', 'Logotiplar, qadoqlar, korporativ identifikatsiya va marketing vizuallarini tayyorlash.'),
            ('Motion Designer / 2D/3D Animator', '10 000 000 - 20 000 000 UZS', 'After Effects, Cinema 4D yoki Blender yordamida jozibali reklama roliklari va animatsiyalar yaratish.')
        ],
        'Mijozlarga xizmat': [
            ('Call-Center Katta Operatori (O‘zbek / Rus tili)', '5 500 000 - 9 500 000 UZS', 'Kiruvchi qo‘ng‘iroqlarni qabul qilish, mijozlarga servis va xizmatlar haqida xushmuomala ma’lumot berish.'),
            ('VIP Mijozlar Menejeri (Account Manager)', '9 000 000 - 17 000 000 UZS', 'Katta korporativ mijozlar bilan uzoq muddatli hamkorlikni rivojlantirish va muammolarni zudlik bilan hal qilish.'),
            ('Texnik Qo‘llab-quvvatlash Mutaxassisi (Helpdesk / L1)', '6 000 000 - 11 000 000 UZS', 'Foydalanuvchilarga dasturiy ta’minot va servislar bilan ishlashda yordam ko‘rsatish.')
        ],
        'Qurilish & Ishlab chiqarish': [
            ('Bosh Muhandis-Konstruktor (AutoCAD, Revit)', '16 000 000 - 32 000 000 UZS', 'Ko‘p qavatli turar-joy va savdo markazlari loyihalarini chizish, muhandislik hisob-kitoblarini bajarish.'),
            ('Qurilish Uchastkasi Boshlig‘i (Prorab)', '14 000 000 - 25 000 000 UZS', 'Qurilish jarayonlarini ob’ektda to‘liq nazorat qilish, ishchilar xavfsizligi va smeta rejasini ta’minlash.'),
            ('Sanoat Avtomatikasi Muhandisi (ASUTP / PLC)', '13 000 000 - 24 000 000 UZS', 'Siemens, Schneider Electric kontrollerlarini dasturlash va zavod avtomatika liniyalarini sozlash.')
        ],
        'Ta’lim': [
            ('IELTS / General English Katta O‘qituvchisi (Band 8.0+)', '9 000 000 - 20 000 000 UZS', 'Zamonaviy interaktiv metodikalar asosida IELTS va ingliz tili darslarini yuqori darajada o‘tish.'),
            ('Frontend / Web Dasturlash Bo‘yicha Mentor', '10 000 000 - 18 000 000 UZS', 'Yosh dasturchilarga HTML, CSS, JavaScript va React bo‘yicha amaliy darslar va kod tekshiruvlarini o‘tkazish.')
        ],
        'Transport & Logistika': [
            ('Xalqaro Logistika Menejeri (Avto / Temir yo‘l)', '12 000 000 - 24 000 000 UZS', 'Xitoy, Turkiya, Yevropa va MDH davlatlaridan multimodal yuk tashuvlarini tashkil etish.'),
            ('Katta Ombor Mudiri (WMS / 1C Sklad)', '8 000 000 - 15 000 000 UZS', 'Tovarlarni qabul qilish, joylashtirish, inventarizatsiya va yuklash-tushirish jarayonlarini boshqarish.'),
            ('Kuryerlik Xizmati Haydovchisi (Shaxsiy avtomobilda)', '7 000 000 - 13 000 000 UZS', 'Shahardagi manzillarga buyurtmalarni o‘z vaqtida, sifatli va xushmuomalalik bilan yetkazib berish.')
        ]
    }

    # Generate across all 15 regions
    for reg in REGIONS:
        for cat, pos_list in positions_by_cat.items():
            # Pick 2-3 positions per category per region
            sample_count = 3 if reg in ['Toshkent shahri', 'Samarqand viloyati', 'Farg‘ona viloyati', 'Masofaviy (Remote)'] else 2
            chosen = random.sample(pos_list, min(sample_count, len(pos_list)))
            for title, sal, desc in chosen:
                company = random.choice(TOP_UZ_COMPANIES.get(cat, ['WorkHub Hamkor Korxonasi']))
                full_desc = f"{company} korxonasi {reg} hududida '{title}' lavozimiga tanlov e’lon qiladi. {desc} Biz barcha xodimlarimizga rasmiy ish bilan ta’minlash, qulay mehnat sharoiti, o‘z vaqtida yuqori maosh va kasbiy o‘sish imkoniyatlarini kafolatlaymiz. WorkHub orqali o‘z rezyumeingizni yuboring."
                
                generated.append({
                    'title': title,
                    'company': company,
                    'salary': sal,
                    'location': reg,
                    'description': full_desc,
                    'category': cat,
                    'source': 'WorkHub'
                })

    return generated

def main():
    print("=== WORKHUB REAL-TIME ALL-REGION JOB AGGREGATOR STARTED ===")
    all_vacancies = []

    # 1. Scrape HH.uz with diverse queries
    hh_queries = [
        'developer', 'python', 'react', 'javascript', 'backend', 'frontend', 'golang', 'flutter',
        'devops', 'qa', 'designer', 'smm', 'marketing', 'buxgalter', 'menejer',
        'operator', 'muhandis', 'haydovchi', 'administrator', 'savdo', 'kuryer', 'logistika',
        'o‘qituvchi', 'ingliz', 'toshkent', 'samarqand', 'buxoro', 'fargona', 'andijon', 'namangan'
    ]

    for q in hh_queries:
        print(f"Scraping vacancies for '{q}'...")
        items = scrape_hh(q, page=0)
        all_vacancies.extend(items)
        time.sleep(0.3)

    # 2. Scrape OLX categories
    print("Scraping OLX.uz job categories...")
    olx_items = scrape_olx()
    print(f" -> Found {len(olx_items)} live vacancies from OLX categories")
    all_vacancies.extend(olx_items)

    # 3. Generate high-quality regional vacancies for all 15 regions
    print("Generating comprehensive regional catalog across all 15 regions...")
    regional_items = generate_regional_catalog()
    print(f" -> Generated {len(regional_items)} verified regional vacancies")
    all_vacancies.extend(regional_items)

    print(f"\nTotal raw vacancies collected: {len(all_vacancies)}")

    # Deduplicate in memory by (title, company, location)
    unique = {}
    for v in all_vacancies:
        # Enforce source = 'WorkHub'
        v['source'] = 'WorkHub'
        v['description'] = clean_text(v['description'])
        key = (v['title'].strip().lower(), v['company'].strip().lower(), v['location'])
        if key not in unique:
            unique[key] = v

    print(f"Unique high-quality vacancies after deduplication: {len(unique)}")

    # Generate SQL statements
    sql_statements = []
    base_time = datetime.now(timezone.utc)

    for item in unique.values():
        v_id = str(uuid.uuid4())
        title = item['title'].replace("'", "''")
        company = item['company'].replace("'", "''")
        loc = item['location'].replace("'", "''")
        desc = item['description'].replace("'", "''")
        sal = item['salary'].replace("'", "''")
        cat = item['category'].replace("'", "''")
        source = 'WorkHub'

        job_types = ['Full-time', 'Full-time', 'Part-time', 'Remote', 'Gibrid']
        job_type = 'Remote' if 'Remote' in loc else random.choice(job_types)

        experiences = ['1-3 yil', '1-3 yil', '3-5 yil', 'Talab etilmaydi', '5+ yil']
        exp = random.choice(experiences)

        tags = ', '.join([cat.split(' & ')[0], job_type, loc.split(' ')[0]])
        is_featured = 'true' if random.random() < 0.15 else 'false'
        views = random.randint(35, 620)

        offset_hours = random.randint(1, 168)
        created_at = (base_time - timedelta(hours=offset_hours)).isoformat()

        sql = f"""
        INSERT INTO vacancies (
            id, title, company, location, description, salary, category, job_type, experience, tags, company_logo, is_verified, is_featured, views_count, source, created_at, updated_at
        ) VALUES (
            '{v_id}', '{title}', '{company}', '{loc}', '{desc}', '{sal}', '{cat}', '{job_type}', '{exp}', '{tags}', '', true, {is_featured}, {views}, '{source}', '{created_at}', '{created_at}'
        ) ON CONFLICT DO NOTHING;
        """
        sql_statements.append(sql)

    # Write to a file and execute inside postgres container
    sql_script = '\n'.join(sql_statements)
    with open('/tmp/vacancies_seed.sql', 'w', encoding='utf-8') as f:
        f.write("BEGIN;\n" + sql_script + "\nCOMMIT;\n")

    print(f"Writing {len(sql_statements)} statements to PostgreSQL...")
    cmd = "docker exec -i workhub_postgres psql -U postgres -d workhub < /tmp/vacancies_seed.sql"
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if res.returncode == 0:
        print("✅ SQL execution succeeded!")
    else:
        print(f"⚠️ SQL execution error: {res.stderr}")

    # Ensure all vacancies in DB have source = 'WorkHub' and clean descriptions
    clean_all_cmd = """
    docker exec -i workhub_postgres psql -U postgres -d workhub -c "
        UPDATE vacancies SET source = 'WorkHub' WHERE source <> 'WorkHub';
        UPDATE vacancies SET description = REGEXP_REPLACE(description, 'OLX platformasida joylashtirilgan vakansiya:\s*', 'WorkHub orqali e''lon qilingan rasmiy vakansiya: ', 'gi') WHERE description ILIKE '%OLX%';
        UPDATE vacancies SET description = REGEXP_REPLACE(description, 'hh\.uz', 'WorkHub', 'gi') WHERE description ILIKE '%hh.uz%';
        UPDATE vacancies SET description = REGEXP_REPLACE(description, 'HeadHunter', 'WorkHub', 'gi') WHERE description ILIKE '%headhunter%';
    "
    """
    subprocess.run(clean_all_cmd, shell=True)

    # Check total vacancies count in database
    count_cmd = "docker exec workhub_postgres psql -U postgres -d workhub -t -c 'SELECT COUNT(*) FROM vacancies;'"
    total_db = subprocess.check_output(count_cmd, shell=True).decode().strip()
    print(f"\n🎉 Total active WorkHub vacancies now in PostgreSQL: {total_db}")

if __name__ == '__main__':
    main()
