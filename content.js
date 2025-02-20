// Load KaTeX from CDN
const loadKaTeX = async () => {
    return new Promise((resolve, reject) => {
        try {
            // Add KaTeX CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);

            // Add KaTeX script
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
            script.onload = () => {
                console.log('KaTeX loaded successfully');
                resolve();
            };
            script.onerror = (error) => {
                console.error('Failed to load KaTeX:', error);
                reject(error);
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('Error in loadKaTeX:', error);
            reject(error);
        }
    });
};

// Function to detect and render LaTeX
const renderLaTeX = () => {
    try {
        console.log('Starting LaTeX rendering...');
        
        const textNodes = document.evaluate(
            '//text()',
            document.body,
            null,
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
            null
        );

        console.log(`Found ${textNodes.snapshotLength} text nodes to process`);

        for (let i = 0; i < textNodes.snapshotLength; i++) {
            const node = textNodes.snapshotItem(i);
            const text = node.textContent.trim();
            
            // Skip empty nodes or nodes that don't contain potential LaTeX
            if (!text || !(/[\\\$\^_\{\}]/.test(text))) continue;

            // Regular expressions to match LaTeX patterns
            const patterns = [
                // Full equations
                /\$\$(.*?)\$\$/g,    // $$ ... $$
                /\\\[(.*?)\\\]/g,    // \[ ... \]
                /\\begin\{equation\}(.*?)\\end\{equation\}/g,  // \begin{equation}...\end{equation}
                
                // Inline math
                /\\\((.*?)\\\)/g,    // \( ... \)
                /\$((?:[^$]|\\\$)+)\$/g,  // $ ... $ (allowing escaped $)
                
                // Common LaTeX expressions without delimiters
                /(\\(?:frac|sqrt|sum|int|prod|lim|inf|rightarrow|leftarrow|partial|nabla|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega){(?:[^{}]*{[^{}]*})*[^{}]*})/g,
                
                // Math expressions with superscripts and subscripts
                /([a-zA-Z0-9]+(?:_[a-zA-Z0-9]+|\^[a-zA-Z0-9]+|\{[^\}]+\})+)/g,
                
                // Complex expressions (like ds^2 = ...)
                /((?:d[a-zA-Z]|\\[a-zA-Z]+)?(?:\^[0-9]+|\{[^\}]+\})?(?:\s*=\s*[-+]?\s*(?:\\frac{[^}]*}{[^}]*}|[^=+\s]+)(?:\s*[-+]\s*(?:\\frac{[^}]*}{[^}]*}|[^=+\s]+))*)+)/g
            ];

            let modified = text;
            let hasLatex = false;

            patterns.forEach(pattern => {
                modified = modified.replace(pattern, (match, latex) => {
                    try {
                        // Skip if it's just a number or simple text
                        if (/^\s*[\d.]+\s*$/.test(match)) {
                            return match;
                        }

                        // Skip if it doesn't contain any LaTeX-like content
                        if (!/[\\{}^_=$]/.test(match)) {
                            return match;
                        }
                        
                        hasLatex = true;
                        // Ensure the LaTeX is properly wrapped
                        let wrappedLatex = latex || match;
                        if (!/^\$.*\$$/.test(wrappedLatex) && !/^\\\(.*\\\)$/.test(wrappedLatex)) {
                            wrappedLatex = `$${wrappedLatex}$`;
                        }

                        const rendered = katex.renderToString(wrappedLatex.trim(), {
                            throwOnError: false,
                            displayMode: pattern.toString().includes('\\[') || 
                                       pattern.toString().includes('equation') ||
                                       pattern.toString().includes('\\$\\$'),
                            strict: false,
                            output: 'html'
                        });
                        console.log('Rendered LaTeX:', wrappedLatex);
                        return rendered;
                    } catch (e) {
                        console.error('LaTeX rendering error for:', match, e);
                        return match;
                    }
                });
            });

            if (hasLatex) {
                const span = document.createElement('span');
                span.innerHTML = modified;
                node.parentNode.replaceChild(span, node);
            }
        }
    } catch (error) {
        console.error('Error in renderLaTeX:', error);
    }
};

// Main execution
(() => {
    try {
        console.log('Extension starting...');
        renderLaTeX();
        
        // Watch for dynamic content changes
        const observer = new MutationObserver((mutations) => {
            renderLaTeX();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    } catch (error) {
        console.error('Error in main execution:', error);
    }
})(); 