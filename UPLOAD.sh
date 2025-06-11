echo "\t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"
letra=$(tr -dc 'a-z' </dev/urandom | head -c1)
git add . && git commit -m "nova atualização: $letra" && git push origin main
