---
name: memory-notes
description: This skill should be used when the user wants to generate development logs with details of development tasks done, based on files modified (stash or not) and session context. Use when creating development log notes with structured format including metadata, objective, implementation summary, files changed, key decisions, validation performed, and risks/follow-ups. 
license: MIT
compatibility: OpenCode
metadata:
  version: "1.1.0"
---

# Memory Notes

Write well-structured notes that can be parsed into a searchable knowledge graph. Every note is a markdown file with three key sections: frontmatter, observations, and relations.

This skill has been enhanced to support generating structured development logs that capture the details of development tasks based on files modified (stashed or not) and session context. The enhanced format includes metadata, objective, implementation summary, files changed, key decisions, validation performed, and risks/follow-ups sections.

## Before Creating a Note

Always search before creating a new note. Duplicates fragment your knowledge graph — updating an existing note is almost always better than creating a second one.

## Using This Skill for Development Logs

This skill can be used to generate structured development logs that capture the details of development tasks based on files modified (stashed or not) and session context.

### Development Log Format

Development logs follow a specific format with the following sections:

- **Frontmatter**: Contains metadata including title, type, and permalink
- **Metadata**: Task ID, date, project, branch, and commit information
- **Objective**: Clear statement of what was accomplished
- **Implementation Summary**: Detailed breakdown of what was implemented
- **Files Changed**: List of all modified files grouped by functionality
- **Key Decisions**: Important architectural or technical decisions made
- **Validation Performed**: Tests, reviews, and checks that were performed
- **Risks and Follow-ups**: Identified risks and recommended follow-up actions

### Development Log Template

A template file is provided at `references/development-log-template.md` that shows the exact format to use.

### Best Practices for Development Logs

1. **Be specific**: Include concrete details about what was changed and why
2. **Link to related items**: Reference related issues, tickets, or documentation
3. **Include validation**: Document how you verified your changes work correctly
4. **Note decisions**: Record important technical decisions and their rationale
5. **Plan follow-ups**: Identify any remaining work or potential improvements

### Search with Multiple Variations

A single search often misses. Try the full name, abbreviations, acronyms, and keywords:

For people, try full name and last name. For organizations, try the full name and common abbreviations.

### Decision Tree

- **Entity exists** → Update it with (append observations, add relations, find-and-replace outdated info)
- **Entity doesn't exist** → Create it
- **Unsure if it's the same entity** → Read the existing note first, then decide

### Granular Updates

When a note already exists, make targeted edits instead of rewriting the whole file:

This preserves existing content and keeps the edit history clean.

## Best Practices

1. **Start with context.** Before listing observations, explain *why* this note exists. Future-you (or your AI collaborator) will thank you.

2. **Favor completeness.** Write rich, substantive notes. we search pulls relevant chunks from note bodies, so longer notes with more context are *more* discoverable, not less. Use prose in the body to tell the full story — the background, the reasoning, the nuance. Then distill key facts into `[category] content` observations for structured queries. Both matter: prose gives meaning, observations give precision.

3. **Build incrementally.** Add to existing notes rather than creating duplicates.

4. **Review AI-generated content.** When an AI writes notes for you, review them for accuracy. The AI captures structure well but may miss nuance.

5. **Use consistent titles.** Note titles are identifiers in the knowledge graph. `API Design Decisions` and `Api Design decisions` are different entities. Pick a convention and stick with it.

6. **Link related concepts.** The value of a knowledge graph compounds with connections. A note with zero relations is an island — useful, but not as powerful as a connected one.

7. **Let the graph grow naturally.** Don't try to design a perfect taxonomy upfront. Write notes as you work, add relations as connections emerge.