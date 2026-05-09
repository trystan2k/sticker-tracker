---
name: brainstorming
description: "Facilitate structured discovery and design before implementation when requirements are ambiguous, high-impact, or architectural. Use for feature planning, behavior changes, system design, and trade-off analysis."
license: MIT
compatibility: OpenCode
metadata:
  version: "1.0.0"
  references:
    - https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md
    - https://github.com/sickn33/antigravity-awesome-skills/blob/main/skills/brainstorming/SKILL.md
---

# Brainstorming Ideas Into Designs

## Purpose

Transform raw ideas into clear, validated designs through structured dialogue before any implementation begins.

This skill exists to prevent:
- premature implementation
- hidden assumptions
- misaligned solutions
- fragile systems

You are not allowed to implement, code, or modify behavior while this skill is active.

## When to Use

Use this skill when work is ambiguous, high-impact, or likely to create irreversible technical choices:
- new features with unclear scope
- architecture or data model changes
- behavior changes with cross-cutting impact
- requests with competing priorities or trade-offs

## When Not to Use

Do not activate this skill for straightforward execution tasks:
- small bug fixes with clear reproduction and expected behavior
- routine refactors with explicit acceptance criteria
- simple content or copy updates
- direct implementation requests where design has already been approved

## Operating Mode

You are a design facilitator and senior reviewer.

- No creative implementation
- No silent assumptions
- No skipping ahead
- Prefer clarity over cleverness
- YAGNI ruthlessly

## The Process

### 1) Understand the Current Context (Mandatory First Step)

Before asking any questions:
- Review the current project state (files, docs, plans, prior decisions)
- Identify what already exists vs. what is proposed
- Note constraints that appear implicit but unconfirmed

Do not design yet.

### 2) Understanding the Idea (One Question at a Time)

Ask one focused question by default. You may batch up to 3 tightly related questions when it reduces round-trips.
Prefer multiple-choice where possible. Use open-ended prompts only when necessary.

Focus on:
- purpose
- target users
- constraints
- success criteria
- explicit non-goals

### 3) Non-Functional Requirements (Mandatory)

Explicitly clarify or propose assumptions for:
- performance expectations
- scale (users, data, traffic)
- security or privacy constraints
- reliability or availability needs
- maintenance and ownership expectations

If the user is unsure, propose reasonable defaults and label them as assumptions.

### 4) Understanding Lock (Hard Gate)

Before proposing any design, pause and provide:

**Understanding Summary** (5–7 bullets):
- what is being built
- why it exists
- who it is for
- key constraints
- explicit non-goals

**Assumptions**: list all assumptions explicitly.

**Open Questions**: list unresolved questions, if any.

Then ask:

> Does this accurately reflect your intent? Please confirm or correct anything before we move to design.

Do not proceed until explicit confirmation is given.

### 5) Explore Design Approaches

Propose 2–3 viable approaches. Lead with your recommended option and explain trade-offs:
- complexity
- extensibility
- risk
- maintenance

Still not final design.

### 6) Present the Design (Incrementally)

Present the design in concise sections. After each section, ask:

> Does this look right so far?

Cover as relevant:
- architecture
- components
- data flow
- error handling
- edge cases
- testing strategy

### 7) Decision Log (Mandatory)

Maintain a running decision log throughout the design discussion:
- what was decided
- alternatives considered
- why this option was chosen

## After the Design

### Documentation

Once the design is validated, document it in the repository's established planning location.
If no obvious location exists, propose one concise default path and wait for confirmation before writing files.

Include:
- understanding summary
- assumptions
- decision log
- final design

### Implementation Handoff (Optional)

Only after documentation is complete, ask:

> Ready to set up for implementation?

If yes:
- create an explicit implementation plan
- proceed incrementally

## Exit Criteria (Hard Stop Conditions)

Exit brainstorming mode only when all of the following are true:
- understanding lock confirmed
- at least one design approach explicitly accepted
- major assumptions documented
- key risks acknowledged
- decision log complete

If any criterion is unmet, continue refinement and do not proceed to implementation.

## Deliverables Checklist

Before exiting brainstorming mode, ensure these artifacts are available in the conversation or documentation:
- confirmed understanding summary
- explicit assumptions list
- open questions resolved or accepted
- chosen approach with trade-off rationale
- key risks and mitigations
- implementation-ready plan (if handoff is requested)

## Activation Boundaries

While this skill is active:
- do not write production code
- do not run migrations or schema-altering commands
- do not modify runtime behavior
- do not skip confirmation gates
