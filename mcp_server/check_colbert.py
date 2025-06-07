import inspect
try:
    # Try importing ColBERT's classes
    from colbert.modeling.colbert import ColBERT
except ImportError:
    try:
        from colbert import ColBERT
    except ImportError:
        print("ERROR: Could not import ColBERT from any package")
        exit(1)

# Print ColBERT version/path and constructor signature
print("\nCOLBERT VERSION INFO:")
print(f"ColBERT module path: {ColBERT.__module__}")
print(f"ColBERT class: {ColBERT.__name__}")

print("\nCOLBERT CONSTRUCTOR SIGNATURE:")
sig = inspect.signature(ColBERT.__init__)
print(f"{sig}")

print("\nCOLBERT AVAILABLE METHODS:")
methods = [method for method in dir(ColBERT) if not method.startswith('_')]
print("\n".join(methods))

# Check if from_pretrained is available
if hasattr(ColBERT, 'from_pretrained'):
    print("\nfrom_pretrained SIGNATURE:")
    sig = inspect.signature(ColBERT.from_pretrained)
    print(f"{sig}")
else:
    print("\nfrom_pretrained method is NOT available")

print("\nDONE")
