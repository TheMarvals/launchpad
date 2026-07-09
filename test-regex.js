const html = `<p>\`\`\`mermaid</p><p>graph TD</p><p>A --&gt; B</p><p>\`\`\`</p>`;
let processed = html.replace(/```mermaid([\s\S]*?)```/g, (match, p1) => {
  let cleanContent = p1.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ');
  cleanContent = cleanContent.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  return `<div class="mermaid">${cleanContent.trim()}</div>`;
});
console.log(processed);
