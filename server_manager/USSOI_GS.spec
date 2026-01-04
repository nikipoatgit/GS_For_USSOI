# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['run_gs.py'],             # Your main entry script
    pathex=[],
    binaries=[],
    datas=[
        ('staticfiles', 'staticfiles'),
        ('templates', 'templates'),
        ('server_manager', 'server_manager'), # Settings folder
        ('core', 'core'),                     # Your app logic
    ],
    hiddenimports=[
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'channels',
        'daphne',
        'server_manager.asgi', # CRITICAL: Allows Daphne to find your app
        'core',                # Ensure your app module is importable
        'whitenoise',
        'whitenoise.middleware',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='GS_USSOI',          # Name of your final EXE
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,              # True = Keep the black terminal window open
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='no_bg.ico'      # Uncomment this if you have an .ico file
)