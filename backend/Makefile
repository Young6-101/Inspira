ARTIFACTS_DIR ?= build
PYTHON ?= python3
PIP ?= $(PYTHON) -m pip

.PHONY: build-BackendFunction clean

build-BackendFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	$(PIP) install \
		--target "$(ARTIFACTS_DIR)" \
		--platform manylinux2014_x86_64 \
		--implementation cp \
		--python-version 3.11 \
		--only-binary=:all: \
		-r requirements.txt
	cp -R main.py settings.py file_processor llm rag_engine "$(ARTIFACTS_DIR)"/

clean:
	rm -rf "$(ARTIFACTS_DIR)"
