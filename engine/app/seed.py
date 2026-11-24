"""Demo-mode data for the Togather demo.

Everything here is FICTIONAL and marked demo=True so the UI can label it.
Live mode replaces it with real, cited discovery results.
"""
from __future__ import annotations

DEMO_SOURCE = "https://demo.pitchfeed.local"

DEMO_PRODUCT = {
    "name": "Togather",
    "description": (
        "A volunteer-coordination app for community organizations. Volunteers discover "
        "shifts in a short-video feed, sign up in one tap, get role explainer videos and "
        "impact certificates. Coordinators post events, track show-ups and thank volunteers."
    ),
    "url": "https://togather.example",
    "customers": "Kiwanis Club of Campbell (pilot)",
    "pricing": "Free for clubs under 50 volunteers; $49/month per organization after that",
}

DEMO_FOUNDER = {
    "name": "You",
    "schools": ["San José State University"],
    "past_employers": ["Student Union of SJSU"],
    "programs": ["CodePath", "AI4ALL"],
    "region": "San Francisco Bay Area",
}

DEMO_ICP = {
    "summary": "Bay Area community organizations that run recurring volunteer events and struggle to recruit and retain volunteers.",
    "industries": [
        {"label": "Civic & social organizations", "naics": "813410", "confidence": 0.91},
        {"label": "Individual & family services", "naics": "624190", "confidence": 0.78},
        {"label": "Food banks", "naics": "624210", "confidence": 0.74},
    ],
    "company_size": {"headcount": "1–200 staff", "volunteers": "50–2,000 volunteers",
                     "revenue": "<$10M", "confidence": 0.72},
    "personas": [
        {"title": "Volunteer Coordinator / Volunteer Manager", "seniority": "Manager", "confidence": 0.93},
        {"title": "Executive Director", "seniority": "Executive", "confidence": 0.81},
        {"title": "Club President (service clubs)", "seniority": "Executive", "confidence": 0.77},
    ],
    "triggers": [
        {"label": "Hiring a volunteer coordinator", "why": "Sign of volunteer-management pain", "confidence": 0.88},
        {"label": "New large service event announced", "why": "Needs many volunteers fast", "confidence": 0.84},
        {"label": "Public volunteer shortage", "why": "Stated pain in their own words", "confidence": 0.86},
        {"label": "New grant or funding", "why": "Budget for tools", "confidence": 0.69},
    ],
    "regions": ["San Francisco Bay Area"],
    "negative_signals": ["Hiring freeze", "Outside target region", "Already uses a paid volunteer platform"],
    "expansions": [
        {"id": "exp_1", "label": "University service clubs", "why": "Same recurring-event pattern; students volunteer for hours requirements", "confidence": 0.71, "status": "suggested"},
        {"id": "exp_2", "label": "Corporate volunteering (CSR) teams", "why": "Run quarterly volunteer days, have budget", "confidence": 0.63, "status": "suggested"},
        {"id": "exp_3", "label": "City parks & recreation departments", "why": "Coordinate cleanup days with public volunteers", "confidence": 0.58, "status": "suggested"},
    ],
    "demo": True,
}

# Candidates found by "discovery". days_ago drives lead temperature.
DEMO_CANDIDATES = [
    {
        "company": "Maple Grove Volunteer Center", "domain": "maplegrove-vc.example",
        "industry": "Civic & social organizations", "size": "35 staff, ~900 volunteers",
        "region": "San Francisco Bay Area",
        "signals": [
            {"type": "hiring", "text": "Posted a job for a full-time Volunteer Coordinator",
             "quote": "seeking a Volunteer Coordinator to recruit, schedule and retain our volunteers",
             "url": f"{DEMO_SOURCE}/maplegrove/jobs", "days_ago": 4},
            {"type": "pain", "text": "Annual report says weekend shifts are often understaffed",
             "quote": "weekend shifts were understaffed more than a third of the time",
             "url": f"{DEMO_SOURCE}/maplegrove/report", "days_ago": 30},
        ],
        "buyer": {"name": "Dana Reyes", "title": "Director of Volunteer Programs"},
        "connector": {"name": "Priya Shah", "title": "Program Associate", "school": "San José State University"},
    },
    {
        "company": "Harborview Kiwanis Club", "domain": "harborviewkiwanis.example",
        "industry": "Civic & social organizations", "size": "60 members",
        "region": "San Francisco Bay Area",
        "signals": [
            {"type": "event", "text": "Announced a spring coastal cleanup needing 120 volunteers",
             "quote": "we will need 120 volunteers for our spring coastal cleanup",
             "url": f"{DEMO_SOURCE}/harborview/news", "days_ago": 6},
        ],
        "buyer": {"name": "Tom Becker", "title": "Club President"},
        "connector": {"name": "Leo Martin", "title": "Member", "employer": "Student Union of SJSU"},
    },
    {
        "company": "Riverside Food Bank Network", "domain": "riversidefoodbank.example",
        "industry": "Food banks", "size": "80 staff, ~2,000 volunteers",
        "region": "San Francisco Bay Area",
        "signals": [
            {"type": "pain", "text": "Press release about a holiday volunteer shortage",
             "quote": "facing a shortage of volunteers heading into the holiday season",
             "url": f"{DEMO_SOURCE}/riverside/press", "days_ago": 9},
            {"type": "funding", "text": "Received a community grant for operations",
             "quote": "awarded a community operations grant",
             "url": f"{DEMO_SOURCE}/riverside/grant", "days_ago": 20},
        ],
        "buyer": {"name": "Alicia Chen", "title": "Volunteer Manager"},
        "connector": {"name": "Sam Ortiz", "title": "Data Analyst", "program": "CodePath"},
    },
    {
        "company": "Eastside Youth Mentors", "domain": "eastsidementors.example",
        "industry": "Individual & family services", "size": "12 staff, ~150 mentors",
        "region": "San Francisco Bay Area",
        "signals": [
            {"type": "funding", "text": "Won a foundation grant to expand the mentor program",
             "quote": "grant will help us double the number of volunteer mentors",
             "url": f"{DEMO_SOURCE}/eastside/blog", "days_ago": 15},
        ],
        "buyer": {"name": "Marcus Lee", "title": "Executive Director"},
        "connector": None,
    },
    {
        "company": "Coastline Animal Rescue", "domain": "coastlinerescue.example",
        "industry": "Individual & family services", "size": "20 staff",
        "region": "San Francisco Bay Area",
        "signals": [
            {"type": "hiring_freeze", "text": "Announced a hiring and spending freeze",
             "quote": "pausing all new hiring and spending this year",
             "url": f"{DEMO_SOURCE}/coastline/update", "days_ago": 10},
        ],
        "buyer": {"name": "Jo Park", "title": "Operations Lead"},
        "connector": None,
    },
    {
        "company": "Summit Senior Services", "domain": "summitseniors.example",
        "industry": "Individual & family services", "size": "40 staff",
        "region": "Denver, CO",
        "signals": [
            {"type": "hiring", "text": "Hiring a volunteer coordinator",
             "quote": "hiring a Volunteer Coordinator",
             "url": f"{DEMO_SOURCE}/summit/jobs", "days_ago": 3},
        ],
        "buyer": {"name": "Rae Collins", "title": "Volunteer Coordinator"},
        "connector": None,
    },
]

DEMO_COMPETITORS = [
    {"name": "SignUpGenius", "category": "Sign-up sheets", "positioning": "Generic sign-up forms for any event"},
    {"name": "VolunteerHub", "category": "Volunteer management", "positioning": "Full volunteer database for larger orgs"},
    {"name": "Spreadsheets + group chats", "category": "Status quo", "positioning": "Free, but manual and leaky"},
]
