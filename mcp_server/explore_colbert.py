import colbert
import inspect

# Print basic module info
print(f"ColBERT module version: {getattr(colbert, '__version__', 'unknown')}")

# Check available classes and their initialization patterns
print("\nKEY CLASSES:")
key_classes = ['Searcher', 'Indexer', 'Trainer']
for cls_name in key_classes:
    if hasattr(colbert, cls_name):
        cls = getattr(colbert, cls_name)
        print(f"\n{cls_name} CLASS:")
        print(f"  Signature: {inspect.signature(cls.__init__)}")
        methods = [m for m in dir(cls) if not m.startswith('_') and callable(getattr(cls, m))]
        print(f"  Methods: {', '.join(methods)}")
    else:
        print(f"\n{cls_name} CLASS: Not found")

# Check for models in the modeling module
print("\nCHECKING MODELING MODULE:")
if hasattr(colbert, 'modeling'):
    modeling = colbert.modeling
    print(f"Available in modeling: {dir(modeling)}")
    if hasattr(modeling, 'colbert') and hasattr(modeling.colbert, 'ColBERT'):
        print("\nFound ColBERT class in modeling.colbert")
        cls = modeling.colbert.ColBERT
        print(f"  Signature: {inspect.signature(cls.__init__)}")
    else:
        print("\nNo ColBERT class in modeling.colbert")
else:
    print("No modeling module found")

# Try to initialize a searcher as a minimal example
print("\nTRYING TO CREATE A SEARCHER:")
try:
    # Try with minimal args
    searcher = colbert.Searcher('colbert-checkpoint', collection='')
    print("✓ Successfully created a Searcher with minimal args")
except Exception as e:
    print(f"✗ Failed to create Searcher: {e}")
    print("Trying with more args...")
    try:
        searcher = colbert.Searcher(
            'colbert-checkpoint', 
            collection='',
            index_root='./colbert-index',
            verbose=True
        )
        print("✓ Successfully created a Searcher with more args")
    except Exception as e:
        print(f"✗ Failed to create Searcher with more args: {e}")

print("\nDONE")
