# Ralph-Loop Plugin: Complete Beginner's Guide

Welcome! This guide will walk you through setting up and using the Ralph-Loop plugin from absolute zero. Don't worry if you're new to this—we'll explain everything in plain English with the technical terms right there in parentheses so you learn as you go.

---

## Table of Contents

1. [What Is Ralph-Loop?](#what-is-ralph-loop)
2. [Prerequisites (What You Need Before Starting)](#prerequisites-what-you-need-before-starting)
3. [Step 1: Open Your Command Line (Terminal)](#step-1-open-your-command-line-terminal)
4. [Step 2: Navigate to Your Project Folder](#step-2-navigate-to-your-project-folder)
5. [Step 3: Make Sure Your Project Is a Git Repository](#step-3-make-sure-your-project-is-a-git-repository)
6. [Step 4: Create Your Specifications (What You Want Built)](#step-4-create-your-specifications-what-you-want-built)
7. [Step 5: Create an Implementation Plan File](#step-5-create-an-implementation-plan-file)
8. [Step 6: Create an AGENTS File (Build Instructions)](#step-6-create-an-agents-file-build-instructions)
9. [Step 7: Run the Planning Mode](#step-7-run-the-planning-mode)
10. [Step 8: Run the Build Mode](#step-8-run-the-build-mode)
11. [Understanding the Loop Iteration Process](#understanding-the-loop-iteration-process)
12. [Common Issues and How to Fix Them](#common-issues-and-how-to-fix-them)
13. [Quick Reference Cheat Sheet](#quick-reference-cheat-sheet)

---

## What Is Ralph-Loop?

Ralph-Loop is a plugin (a small add-on program) that helps you build software automatically. Think of it like having a robot assistant that:

- Reads your requirements (what you want built)
- Creates a plan (step-by-step list of what needs to happen)
- Builds the software one piece at a time
- Runs tests to make sure everything works
- Saves (commits) its progress and shares (pushes) it online

The "loop" part means it keeps doing this over and over until the job is done. It's like a factory assembly line that runs continuously.

---

## Prerequisites (What You Need Before Starting)

Before you begin, make sure you have these things ready:

### Required Software

1. **Git** - A version control system (tracks changes to your code). You probably have this installed already.
2. **OpenCode** - The main AI assistant tool. This plugin runs inside OpenCode.
3. **A code editor** - Like Visual Studio Code, Notepad++, or even regular Notepad.

### What Your Project Needs

- A folder with your source code (the actual program you're building)
- An internet connection (for AI to work)
- A GitHub, GitLab, or similar account (for saving your code online)

---

## Step 1: Open Your Command Line (Terminal)

The command line (also called terminal, command prompt, or shell) is a text-based way to talk to your computer. Instead of clicking buttons, you type commands (instructions).

**How to open it:**

**On Windows:**
- Press the **Windows key** on your keyboard (usually between Ctrl and Alt)
- Type `cmd` or `command prompt`
- Click on **Command Prompt** or **Windows Terminal**

**On Mac:**
- Press **Command + Space** (the magnifying glass key)
- Type `terminal`
- Press **Enter**

**On Linux:**
- Press **Ctrl + Alt + T**
- Or right-click on your desktop and select **Open Terminal**

You should see a window with text, probably ending with something like `C:\Users\YourName>` or `~/YourName$`. This is where you'll type commands.

---

## Step 2: Navigate to Your Project Folder

Now you need to go to the folder where your project lives. This is called "navigating" or "changing directory."

**First, let's find out where you are:**

Type this and press Enter:
```
pwd
```

This shows your "present working directory" (current folder). On Windows, it might say `C:\Users\YourName`. On Mac/Linux, it might say `/home/YourName`.

**To see what's in your current folder:**

Type this and press Enter:
```
ls
```

On Windows, you can also use:
```
dir
```

This lists all files and folders in your current location.

**To change to your project folder:**

Let's say your project is in `C:\Users\YourName\Documents\MyProject`. Type:
```
cd C:\Users\YourName\Documents\MyProject
```

Or on Mac/Linux:
```
cd /home/YourName/Documents/MyProject
```

**Quick tips:**
- The `cd` command means "change directory" (switch to a different folder)
- Use `cd ..` to go back one folder level
- Use `cd` alone to go back to your home folder
- On Windows, folder paths use backslashes `\`
- On Mac/Linux, folder paths use forward slashes `/`

---

## Step 3: Make Sure Your Project Is a Git Repository

A Git repository (or "repo" for short) is a project that's being tracked by Git. Git keeps a history of all changes, so you can go back if something breaks.

**To check if your project is already a Git repository:**

Type this and press Enter:
```
git status
```

**If you see something like:**
```
On branch main
nothing to commit, working tree clean
```

**Great!** Your project is already a Git repository. Skip to Step 4.

**If you see something like:**
```
fatal: not a git repository
```

**You need to initialize (create) a Git repository:**

1. Make sure you're in your project folder
2. Type this and press Enter:
   ```
   git init
   ```
3. You should see a message like `Initialized empty Git repository in ...`

**Now create a main branch (the main line of development):**
```
git checkout -b main
```

**Then make your first commit (save a snapshot of your current code):**
```
git add .
git commit -m "Initial commit"
```

**Connect to an online repository (optional but recommended):**

If you have a GitHub repository, connect it:
```
git remote add origin https://github.com/YourUsername/YourRepo.git
```

Then push your code:
```
git push -u origin main
```

---

## Step 4: Create Your Specifications (What You Want Built)

Specifications (or "specs" for short) are documents that describe what you want your software to do. Think of them as a recipe or instruction manual.

**Create a `specs` folder in your project:**
```
mkdir specs
```

**Create a specification file:**

Create a new file called `specs/FEATURE_NAME.md` (replace FEATURE_NAME with what you're building).

**Example: Building a Calculator App**

Create `specs/calculator.md` with content like:

```markdown
# Calculator App Specifications

## Purpose
Create a simple calculator that can add, subtract, multiply, and divide numbers.

## Features

### 1. Addition
- User can enter two numbers
- System shows the sum (result of adding them)
- Example: 5 + 3 = 8

### 2. Subtraction
- User can enter two numbers
- System shows the difference (result of subtracting)
- Example: 10 - 4 = 6

### 3. Multiplication
- User can enter two numbers
- System shows the product (result of multiplying)
- Example: 6 × 7 = 42

### 4. Division
- User can enter two numbers
- System shows the quotient (result of dividing)
- Example: 20 ÷ 4 = 5
- Handle division by zero (don't crash, show an error)

## User Interface
- Display numbers clearly
- Show operation symbols (+, -, ×, ÷)
- Show result after each calculation
- Provide a way to clear/start over

## Error Handling
- If user enters invalid input (letters instead of numbers), show error message
- Division by zero should show "Cannot divide by zero"
```

**Key elements of a good specification:**

1. **Purpose** - What is this feature for?
2. **Features** - List each thing it should do
3. **Examples** - Show what inputs and outputs look like
4. **Error handling** - What should happen when things go wrong?
5. **User interface** - How should it look and feel?

**Tips:**
- Be specific (don't say "be fast," say "respond in under 1 second")
- Include examples (they help everyone understand)
- Think about edge cases (what if someone enters nothing? text?)
- Start small and add more features later

---

## Step 5: Create an Implementation Plan File

The implementation plan is where Ralph-Loop tracks what needs to be done, what's being worked on, and what's completed.

**Create a file called `IMPLEMENTATION_PLAN.md` in your project root folder:**

```
touch IMPLEMENTATION_PLAN.md
```

**For now, just add a header:**

```markdown
# Implementation Plan

This document tracks our progress building the calculator app.

## In Progress

## To Do

## Completed
```

Ralph-Loop will update this file automatically as it works. The "In Progress" section shows what's being worked on now. The "To Do" section shows what's waiting. The "Completed" section shows what's finished.

---

## Step 6: Create an AGENTS File (Build Instructions)

The AGENTS file tells Ralph-Loop how to build and test your project. Think of it like a instruction manual for building and checking your code.

**Create a file called `AGENTS.md` in your project root folder:**

```
touch AGENTS.md
```

**Add content based on your project type:**

**For a Node.js/JavaScript project:**
```markdown
## Build & Run

How to BUILD the project (compile/prepare code):

## Validation

Commands to run after making changes:

- Tests: `npm test`
- Typecheck (check for errors): `npm run typecheck`
- Lint (check code style): `npm run lint`
- Run the application: `npm start`

## Operational Notes

How to RUN the project:

### Codebase Patterns

- Source code is in `src/` folder
- Tests are in `__tests__/` or `tests/` folder
- Shared utilities are in `src/lib/` folder
```

**For a Python project:**
```markdown
## Build & Run

How to BUILD the project:

## Validation

Commands to run after making changes:

- Tests: `python -m pytest`
- Run the application: `python main.py`

## Operational Notes

How to RUN the project:

### Codebase Patterns

- Source code is in `src/` folder
- Tests are in `tests/` folder
```

**For a C/C++ project:**
```markdown
## Build & Run

How to BUILD the project:

- Compile: `gcc -o myapp src/*.c`
- Build with make: `make`

## Validation

Commands to run after making changes:

- Tests: `./run_tests`
- Lint: `cppcheck src/`

## Operational Notes

How to RUN the project:

- Run compiled program: `./myapp`

### Codebase Patterns

- Source code is in `src/` folder
- Header files are in `include/` folder
```

---

## Step 7: Run the Planning Mode

Before building, it's a good idea to run the planning mode. This analyzes your specifications and creates a detailed plan.

**Make sure you're in your project folder, then run:**

On Windows (Command Prompt):
```
C:\Users\darick\.config\opencode\plugin\ralph-loop\loop.sh plan
```

On PowerShell:
```
& "C:\Users\darick\.config\opencode\plugin\ralph-loop\loop.sh" plan
```

On Mac/Linux:
```
/c/Users/darick/.config/opencode/plugin/ralph-loop/loop.sh plan
```

**What happens next:**

1. OpenCode starts up and analyzes your project
2. It reads your `specs/*.md` files
3. It studies your source code in `src/`
4. It updates `IMPLEMENTATION_PLAN.md` with tasks to do
5. It commits and pushes the plan to your online repository

**Planning mode is complete when you see the loop restart.** This is normal—it keeps running until you stop it with `Ctrl+C`.

**Press `Ctrl+C` to stop the loop when you see it completing the planning phase.**

**Check the results:**

Open `IMPLEMENTATION_PLAN.md` and look for the task list. It should now have specific items like:
```markdown
# Implementation Plan

## In Progress

## To Do
- Create basic calculator UI structure
- Implement addition function
- Implement subtraction function
- Implement multiplication function
- Implement division function
- Add error handling for invalid input
- Add error handling for division by zero
- Write tests for all functions
- Test user interface

## Completed
- Initial project setup
- Analyzed specifications
```

---

## Step 8: Run the Build Mode

Now you're ready to actually build the software! The build mode will implement each task one by one.

**Make sure you're in your project folder, then run:**

On Windows (Command Prompt):
```
C:\Users\darick\.config\opencode\plugin\ralph-loop\loop.sh
```

On PowerShell:
```
& "C:\Users\darick\.config\opencode\plugin\ralph-loop\loop.sh"
```

On Mac/Linux:
```
/c/Users/darick/.config/opencode/plugin/ralph-loop/loop.sh
```

**What happens during build mode:**

1. **Iteration 1:**
   - Ralph-Loop picks the first task from "To Do"
   - Moves it to "In Progress"
   - Implements the feature
   - Runs tests to verify it works
   - Moves it to "Completed"
   - Commits and pushes changes
   - Shows the next iteration starting

2. **Iteration 2:**
   - Picks the next task
   - Repeats the process
   - Continues until all tasks are done

3. **Continuing iterations:**
   - Each loop completes one task
   - You can watch the progress in real-time
   - The loop continues indefinitely until all work is done

**To stop the loop at any time:**
- Press `Ctrl + C` (hold Control and press C)
- This stops the loop gracefully

**What to watch for:**

- Green text or "PASS" means tests are passing (good!)
- Red text or "FAIL" means tests are failing (need attention)
- Error messages explain what went wrong

---

## Understanding the Loop Iteration Process

Here's a visual explanation of what happens during each iteration:

```
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE ITERATION                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PICK TASK                                               │
│     └─ Read IMPLEMENTATION_PLAN.md                          │
│        └─ Find first item in "To Do"                        │
│                                                             │
│  2. MOVE TO IN PROGRESS                                     │
│     └─ Update IMPLEMENTATION_PLAN.md                        │
│        └─ Move item from "To Do" to "In Progress"           │
│                                                             │
│  3. IMPLEMENT FEATURE                                       │
│     └─ Write code based on specs                            │
│        └─ Create or edit files in src/                      │
│                                                             │
│  4. RUN TESTS                                               │
│     └─ Execute `npm test` (or whatever you specified)       │
│        └─ Check if everything works                         │
│                                                             │
│  5. IF TESTS PASS:                                          │
│        └─ Move item from "In Progress" to "Completed"       │
│        └─ Commit changes: `git add . && git commit`         │
│        └─ Push changes: `git push`                          │
│        └─ Show "======================== LOOP N ========================" │
│                                                             │
│  6. IF TESTS FAIL:                                          │
│        └─ Document issue in IMPLEMENTATION_PLAN.md          │
│        └─ Continue to next iteration (try again)            │
│                                                             │
│  7. REPEAT                                                  │
│     └─ Go back to step 1                                    │
│     └─ Pick next task (if any remain)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Issues and How to Fix Them

### Issue: "fatal: not a git repository"

**Problem:** Your project isn't a Git repository.

**Solution:**
```
git init
git add .
git commit -m "Initial commit"
```

---

### Issue: "error: failed to push some refs"

**Problem:** Your local changes don't match the online repository.

**Solution:**
```
git pull origin main --rebase
git push origin main
```

---

### Issue: "Permission denied" or "command not found"

**Problem:** The script can't run or access something.

**Solution (Windows):**
```
C:\Users\darick\.config\opencode\plugin\ralph-loop\loop.sh plan
```

**Solution (Mac/Linux):**
First make it executable:
```
chmod +x /c/Users/darick/.config/opencode/plugin/ralph-loop/loop.sh
```

Then run:
```
/c/Users/darick/.config/opencode/plugin/ralph-loop/loop.sh plan
```

---

### Issue: Tests keep failing

**Problem:** The code isn't passing tests.

**Solutions:**
1. Check `IMPLEMENTATION_PLAN.md` for error details
2. Look at test output for specific error messages
3. Verify your `AGENTS.md` has correct test commands
4. Run tests manually to see what's failing:
   ```
   npm test
   ```

---

### Issue: "Error: ENOENT: no such file or directory"

**Problem:** A required file or folder is missing.

**Solutions:**
1. Check your specs folder exists: `ls specs/`
2. Check IMPLEMENTATION_PLAN.md exists: `ls IMPLEMENTATION_PLAN.md`
3. Check AGENTS.md exists: `ls AGENTS.md`
4. Make sure you're in the correct project folder

---

### Issue: "nothing to commit, working tree clean"

**Problem:** Ralph-Loop has finished all tasks!

**This is actually good news!** Your project is complete.

**Next steps:**
- Review the completed work
- Add new features by creating new specs
- Share your project with others

---

### Issue: Loop runs forever without stopping

**Problem:** The loop doesn't know when to stop.

**Solutions:**
- Set a maximum iteration count:
  ```
  C:\Users\darick\.config\opencode\plugin\ralph-loop\loop.sh plan 5
  ```
  This stops after 5 iterations.

- Press `Ctrl + C` to stop manually

---

## Quick Reference Cheat Sheet

### Essential Commands

| What You Want | Command |
|--------------|---------|
| Check if in Git repo | `git status` |
| Initialize Git repo | `git init` |
| See current folder | `pwd` |
| List files | `ls` |
| Change folder | `cd foldername` |
| Go back one level | `cd ..` |
| Run planning mode | `loop.sh plan` |
| Run build mode | `loop.sh` |
| Stop the loop | `Ctrl + C` |

### File Locations

| File | Purpose | Location |
|------|---------|----------|
| opencode.json | Plugin configuration | `ralph-loop/opencode.json` |
| PROMPT.md | Build instructions | `ralph-loop/PROMPT.md` |
| PROMPT_plan.md | Planning instructions | `ralph-loop/PROMPT_plan.md` |
| loop.sh | Main script | `ralph-loop/loop.sh` |
| AGENTS.md | Build/test commands | `PROJECT/AGENTS.md` |
| IMPLEMENTATION_PLAN.md | Task tracker | `PROJECT/IMPLEMENTATION_PLAN.md` |
| specs/*.md | Feature requirements | `PROJECT/specs/*.md` |

### Script Usage

| Mode | Command | Description |
|------|---------|-------------|
| Build | `loop.sh` | Build indefinitely until done |
| Build with limit | `loop.sh 10` | Build, max 10 iterations |
| Plan | `loop.sh plan` | Analyze and plan only |
| Plan with limit | `loop.sh plan 5` | Plan, max 5 iterations |

---

## Getting Help

If you run into problems:

1. **Check the error message** - Read what the computer is telling you
2. **Review this guide** - Find the relevant section
3. **Check your files** - Make sure all required files exist
4. **Run manually** - Try running the test command yourself
5. **Ask for help** - Share the error message and what you tried

---

## Next Steps

Once you're comfortable with the basics, you can:

- Add more specifications for additional features
- Customize the AGENTS.md with project-specific commands
- Create shared utilities in `src/lib/` for common code
- Set up continuous integration (CI) for automatic testing
- Invite others to collaborate on your project

---

**Happy building!** The Ralph-Loop plugin is here to help you turn specifications into working software, one iteration at a time.
