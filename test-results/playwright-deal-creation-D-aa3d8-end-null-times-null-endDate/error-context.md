# Page snapshot

```yaml
- generic [active]:
  - generic:
    - list
    - button:
      - img
  - alertdialog "Welcome to MealScout Beta!" [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - img [ref=e5]
        - heading "Welcome to MealScout Beta!" [level=2] [ref=e7]
      - generic [ref=e8]:
        - paragraph [ref=e9]: You're experiencing an early version of MealScout. We're excited to have you here!
        - generic [ref=e10]:
          - paragraph [ref=e11]: "We encourage you to:"
          - list [ref=e12]:
            - listitem [ref=e13]: Try all features and explore the platform
            - listitem [ref=e14]: Report any bugs or issues you encounter
            - listitem [ref=e15]: Share your feedback to help us improve
        - generic [ref=e17]:
          - img [ref=e18]
          - generic [ref=e27]: Found a bug? Use the bug report button (bottom right corner) to send us a screenshot with one click!
    - button "Got it, let's explore!" [ref=e29] [cursor=pointer]
```