# Report Generation Prompt

Generate a comprehensive report about: {{ inputs.topic }}

{% if bundle %}
## Available Data
{{ bundle | dump }}
{% endif %}

## Requirements
- Be detailed and thorough
- Use clear structure with headings
- Include relevant examples
- Cite sources where applicable

Generate the report in Markdown format.
