# 🚀 Development Rules & Best Practices

## **🏗️ Architecture Rules:**
- **Single Responsibility Principle** - Each component/function does ONE thing well
- **Separation of Concerns** - UI logic separate from business logic  
- **Clear Data Flow** - Data flows in one direction, easy to trace
- **No Magic Variables** - If a variable name isn't clear, rename it
- **No Deep Nesting** - Keep functions shallow and readable

## **🧪 Testing & Debugging:**
- **Console Logs First** - Always add logging before implementing complex features
- **Test Incrementally** - Test each feature as we add it, not all at once
- **Error Boundaries** - Every async operation has proper error handling
- **No Silent Failures** - Always log errors and provide fallbacks

## **✅ Code Quality Checklist (Check Every Phase):**
- [ ] **Is it readable?** - Can another developer understand it immediately?
- [ ] **Is it testable?** - Can we test this feature in isolation?
- [ ] **Is it maintainable?** - Will this be easy to modify later?
- [ ] **Does it have fallbacks?** - What happens when things fail?
- [ ] **Is it documented?** - Do we understand why we chose this approach?

## **🚫 Anti-Patterns to Avoid:**
- **No "It Works" Code** - If we can't explain how it works, refactor it
- **No Complex State Management** - Keep state simple and predictable
- **No Tight Coupling** - Components should be loosely connected
- **No Hardcoded Values** - Use constants and configuration

## **🔄 Development Workflow:**
- **Small, focused commits** - One feature/change per commit
- **Build test before commit** - Ensure it compiles without errors
- **Document decisions** - Comment on why we chose certain approaches
- **Ask questions first** - Understand requirements before coding

## **🤝 Partnership Rules:**
- **Ask questions** before implementing complex features
- **Explain the approach** before writing code
- **Test together** to ensure we understand what's happening
- **Refactor early** if something feels complex or unclear

## **📱 Phase Check-In Template:**
```
## �� Phase: [Feature Name]
- [ ] Architecture follows single responsibility principle?
- [ ] Error handling and fallbacks in place?
- [ ] Console logging for debugging?
- [ ] Code is readable and maintainable?
- [ ] Feature tested incrementally?
- [ ] Ready for next phase?
```

---
*Last Updated: September 1, 2025*
*Use this checklist at the end of each major development phase*
