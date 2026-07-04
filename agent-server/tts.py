"""
tts.py - Bilingual TTS (English + Nepali) using Piper (local, offline).

Adapted from raw/backend/server.py for in-process use inside the FastAPI
agent-server, so /process can return synthesized audio without an extra
network hop to a separate TTS service.

Voices:
  English : en_US-ryan-medium      (MALE)
  Nepali  : ne_NP-chitwan-medium   (MALE)

Voice choice is whole-message: any Devanagari or romanized-Nepali word in
the text routes the whole reply through the Nepali voice, otherwise English.
"""

import base64
import io
import os
import re
import urllib.request
import wave

VOICES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "voices")

VOICES = {
    "en_US-ryan-medium": {
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium",
    },
    "ne_NP-chitwan-medium": {
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ne/ne_NP/chitwan/medium",
    },
}

DEVANAGARI_RE = re.compile(r"[ऀ-ॿ]")

ROMAN_NEP = {
    "namaste", "namaskar", "dhanyabad",
    "kasto", "kasari", "kaha", "kahile", "kina",
    "chha", "chhan", "cha",
    "timi", "tapai", "tapain", "hami",
    "mero", "timro", "hamro",
    "ho", "haina",
    "pani", "ra", "ma", "ko", "le", "lai", "bata",
    "hola", "haru",
    "ramro", "naramro", "thik",
    "aaja", "bholi", "hijo",
    "khana", "khayo",
    "garchu", "garchau", "garna", "garnu",
    "bhanne", "kura",
    "nepal", "nepali",
    "sakincha", "hudai", "chhu",
    "hajur", "dai", "didi", "bhai", "baini",
    "garne", "gareko", "bhayeko", "cha", "thiyo",
    "gardai", "gardina", "garnus",
}

_loaded_voices: dict = {}


def _ensure_voice(name: str):
    os.makedirs(VOICES_DIR, exist_ok=True)
    base_url = VOICES[name]["url"]
    for ext in (".onnx", ".onnx.json"):
        path = os.path.join(VOICES_DIR, name + ext)
        if not os.path.exists(path):
            url = f"{base_url}/{name}{ext}"
            urllib.request.urlretrieve(url, path)


def _get_voice(name: str):
    """Lazily load (and download, if missing) a Piper voice on first use."""
    if name not in _loaded_voices:
        from piper import PiperVoice  # imported lazily so agent-server can boot without piper-tts for text-only testing

        _ensure_voice(name)
        _loaded_voices[name] = PiperVoice.load(
            os.path.join(VOICES_DIR, f"{name}.onnx"),
            config_path=os.path.join(VOICES_DIR, f"{name}.onnx.json"),
        )
    return _loaded_voices[name]


def _is_purely_english(text: str) -> bool:
    if DEVANAGARI_RE.search(text):
        return False
    words = re.findall(r"[a-zA-Z]+", text)
    return all(w.lower() not in ROMAN_NEP for w in words)


def synthesize_wav_base64(text: str) -> str:
    """Synthesize `text` to a WAV file and return it as a base64 string."""
    vname = "en_US-ryan-medium" if _is_purely_english(text) else "ne_NP-chitwan-medium"
    voice = _get_voice(vname)

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        voice.synthesize_wav(text, wf)

    return base64.b64encode(buf.getvalue()).decode("ascii")
