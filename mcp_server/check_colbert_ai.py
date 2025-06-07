import sys
import pkgutil

# Print all installed packages to find colbert-related ones
print("LOOKING FOR COLBERT-RELATED PACKAGES...")
all_modules = list(pkgutil.iter_modules())
colbert_modules = [m for m in all_modules if 'colbert' in m.name.lower()]
print(f"Found {len(colbert_modules)} colbert-related modules:")
for m in colbert_modules:
    print(f"- {m.name}")

# Try different import approaches
print("\nTRYING DIFFERENT IMPORT APPROACHES...")

try:
    print("\nAttempting: import colbert_ai")
    import colbert_ai
    print("✓ Successfully imported colbert_ai")
    print(f"Module details: {colbert_ai.__file__}")
    print(f"Available attributes: {dir(colbert_ai)}")
except ImportError as e:
    print(f"✗ Failed: {e}")

try:
    print("\nAttempting: import colbert")
    import colbert
    print("✓ Successfully imported colbert")
    print(f"Module details: {colbert.__file__}")
    print(f"Available attributes: {dir(colbert)}")
except ImportError as e:
    print(f"✗ Failed: {e}")

try:
    print("\nAttempting: from colbert_ai import ColBERT")
    from colbert_ai import ColBERT
    print("✓ Successfully imported ColBERT from colbert_ai")
    print(f"ColBERT class: {ColBERT}")
except ImportError as e:
    print(f"✗ Failed: {e}")

# Print Python path
print("\nPYTHON PATH:")
for p in sys.path:
    print(p)

print("\nDONE")
