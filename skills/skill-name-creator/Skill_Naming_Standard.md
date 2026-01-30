# Agentic Skill Interface Standard (ASIS) v2.01

## 1. Executive Summary

This standard combines **machine‑readability** (code‑native syntax) with **domain specificity** (clear tool taxonomies). It is designed for agentic systems operating across **CLI, API, and GUI** environments.

**Primary Goal**: A skill namespace that allows an LLM to intuit a tool’s purpose from its name alone, minimizing token usage for descriptions and improving recall, indexing, and correctness.

---

## 2. Canonical Syntax

All skill identifiers **MUST** use **PascalCase_With_Underscore_Separators**.

### Format

```
[Namespace]_[Action]_[Target]_[Qualifier(Optional)]
```

### Rationale

| Approach       | Example                  | Issue                    |
| -------------- | ------------------------ | ------------------------ |
| Generic Code   | FileSystem_Read_File     | Too broad                |
| Kebab / CLI    | app-revit-launch         | Invalid for code APIs    |
| **ASIS v2.01** | Revit_Launch_Application | **Specific + Code‑Safe** |

This syntax is valid in **Python, C#, JavaScript**, and aligns with modern LLM tool‑calling APIs.

---

## 3. Segment 1 — Namespace (Context)

The **Namespace** defines *what domain the capability belongs to*.

### 3.1 Core Namespaces (Abstract Capabilities)

Use when the *capability* matters, not the underlying product.

| Namespace | Definition                    | Examples                               |
| --------- | ----------------------------- | -------------------------------------- |
| File      | Local filesystem operations   | File_Read_Content, File_Search_Text    |
| Shell     | OS shell / terminal execution | Shell_Execute_Command                  |
| Net       | Generic network & web actions | Net_Fetch_Url, Net_Download_Resource   |
| Data      | Storage, DB, memory           | Data_Query_Sql, Data_Cache_Store       |
| Logic     | Reasoning, planning, memory   | Logic_Create_Plan, Logic_Recall_Memory |

> Rule: Core namespaces must remain **product‑agnostic**.

---

### 3.2 Integration Namespaces (Product‑Specific)

Use when the tool interacts with a **specific platform, API, or application**.

| Namespace | Domain                 | Examples                  |
| --------- | ---------------------- | ------------------------- |
| Git       | Local VCS              | Git_Commit_Changes        |
| GitHub    | Remote VCS platform    | GitHub_Create_PullRequest |
| Docker    | Containers             | Docker_Build_Image        |
| AWS       | Cloud infrastructure   | AWS_Deploy_Lambda         |
| Revit     | Autodesk Revit GUI/API | Revit_Export_Sheet        |
| Chrome    | Browser automation     | Chrome_Scrape_Page        |

> Rule: **Never mix Core + Integration** in the same namespace.

**❌ Wrong:** File_Revit_Open
**✅ Correct:** Revit_Open_File

---

## 4. Segment 2 — Action (Controlled Vocabulary)

Actions are verbs chosen from a **restricted, intentional vocabulary**.

### 4.1 CRUD Actions (Data)

| Verb   | Usage                     |
| ------ | ------------------------- |
| Read   | Non‑destructive retrieval |
| Write  | Create or overwrite       |
| Update | Partial modification      |
| Delete | Remove                    |
| List   | Enumerate                 |
| Search | Query for matches         |

---

### 4.2 Ops Actions (Operational)

| Verb    | Usage                       |
| ------- | --------------------------- |
| Execute | Run a script/command        |
| Launch  | Start GUI or heavy process  |
| Sync    | Reconcile states            |
| Build   | Compile assets/code         |
| Deploy  | Move to runtime             |
| Connect | Authenticate / open session |
| Backup  | Create restore point        |
| Scan    | Analyze (lint/security)     |

> Avoid vague verbs: **Get, Make, Do, Handle**

---

## 5. Segment 3 — Target (Noun)

The **Target** is the concrete entity being acted upon.

**Examples**:

* File
* Directory
* Repository
* Container
* Window
* Tab
* Row
* Image
* Sheet
* View

> The Target should be specific enough to remove ambiguity.

---

## 6. Optional Segment — Qualifier

Use **only when required** to disambiguate behavior.

**Examples**:

* File_Read_Content_Text
* Revit_Export_Sheet_Pdf
* Data_Backup_Snapshot_Full

> Rule: If the name becomes long, the tool is likely doing too much.

---

## 7. Translation Guide

| Capability   | Generic / CLI | Kebab Style        | **ASIS v2.01**            |
| ------------ | ------------- | ------------------ | ------------------------- |
| Read file    | cat_file      | fs-read-text       | File_Read_Content         |
| Launch Revit | start_revit   | app-revit-launch   | Revit_Launch_Application  |
| Git push     | git_push      | git-repo-sync      | Git_Sync_Remote           |
| Grep search  | find_text     | sys-grep-search    | File_Search_Text          |
| Create PR    | make_pr       | cloud-gh-pr-create | GitHub_Create_PullRequest |
| Lint code    | lint_code     | code-scan-fix      | Code_Scan_Lint            |
| Backup DB    | backup_db     | util-backup-create | Data_Backup_Snapshot      |

---

## 8. Developer Checklist

Before registering a new skill:

* **Syntax**: PascalCase_With_Underscores only
* **Namespace**: Core *or* Integration — never both
* **Verb**: From controlled vocabulary
* **Target**: Concrete and unambiguous
* **Qualifier**: Only if strictly necessary
* **Uniqueness**: No collision with existing tools

---

## 9. Final Recommendation (Standard Position)

**Adopt ASIS v2.01 exactly as defined.**

This structure:

* Optimizes LLM inference and memory
* Enables alphabetical and semantic grouping
* Prevents namespace drift
* Scales cleanly across ecosystems (Codex, Claude, OpenCode)

> If a skill name needs a description to be understood, the name is wrong.

---

## 10. Operational Determinism Rule (Skill Naming)

All ASIS skill identifiers **MUST describe an observable, operational effect**.

A valid skill name represents a capability whose execution results in a **verifiable system action, state change, retrieval, or analysis**. Skill names must be testable as *true or false* after execution.

If a capability cannot be named under these constraints, **it is not a skill** — it is logic, policy, configuration, or documentation.

---

### 10.1 Prohibited Language in Skill Names

Skill identifiers **MUST NOT** contain words or phrases that refer to:

* **Abstract concepts**
  *(e.g., justice, freedom, idea, quality)*

* **Subjective or evaluative terms**
  *(e.g., good, bad, better, optimal, interesting)*

* **Mental or emotional states**
  *(e.g., think, believe, feel, intend, understand)*

* **Metaphysical or supernatural references**
  *(e.g., soul, spirit, fate, divine)*

* **Figurative or metaphorical language**
  *(idioms, metaphors, narrative phrasing)*

* **Ambiguous verbs without measurable outcomes**
  *(e.g., handle, manage, improve, fix)*

---

### 10.2 Required Properties

Each skill name **MUST**:

* Imply a **concrete system effect**
* Describe an action with a **measurable or inspectable result**
* Map directly to an **executable operation**
* Allow post-execution verification without interpretation

The name alone should answer:
**“What observable thing changes or is produced when this runs?”**

---

### 10.3 Examples

#### ❌ Invalid (Non-Deterministic)

* `Logic_Think_About_Problem`
* `Data_Improve_Quality`
* `System_Handle_Error`
* `Logic_Understand_Context`
* `Revit_Fix_Model`

#### ✅ Valid (Operationally Deterministic)

* `Logic_Create_Plan`
* `Data_Scan_Integrity`
* `System_Log_Error`
* `Logic_Parse_Context`
* `Revit_Scan_Model_Warnings`

---

### 10.4 Design Principle

> **Skills do not describe cognition — they describe effects.**

If a name requires explanation to clarify *what physically or digitally occurs*, the name is invalid under ASIS.
