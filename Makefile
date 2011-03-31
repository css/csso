.PHONY: test

test:
	@cd test/cssp && node test.js
	@cd test/cssm && node test.js
