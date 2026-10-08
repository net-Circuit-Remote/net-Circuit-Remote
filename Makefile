.PHONY: context-check test dev-info

context-check:
	python3 scripts/check_context.py

test:
	pytest -q

dev-info:
	python3 scripts/dev-info.py
