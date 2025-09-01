# Shadow Summary Integration Example

This document shows how to integrate the shadow summary generation into the existing MVP without changing its behavior.

## Option 1: Using the Wrapper Component

Add the `ShadowSummaryWrapper` component to your existing component:

```tsx
import { ShadowSummaryWrapper } from '../components/ShadowSummaryWrapper';

// In your existing component (e.g., ChatbotWizard.tsx)
function ChatbotWizard({ user, ...props }) {
  // ... existing code ...

  // Add this near the end of your component, before the return statement
  const currentModuleData = flow[currentModule];
  const moduleAnswers: string[] = [];
  
  if (currentModuleData) {
    for (let i = 0; i < currentStep; i++) {
      const step = currentModuleData.steps[i];
      if (step.type === "question") {
        const key = `${currentModuleData.module}-${i}`;
        const stepAnswers = localAnswers[key] || [];
        moduleAnswers.push(...stepAnswers);
      }
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* ... existing JSX ... */}
      
      {/* Add the shadow summary wrapper */}
      {user && currentModuleData && (
        <ShadowSummaryWrapper
          profileId={user.uid}
          userId={user.uid}
          module={currentModuleData.module}
          answers={moduleAnswers}
          onSummaryGenerated={(success) => {
            if (success) {
              console.log('Shadow summary generated successfully');
            }
          }}
        />
      )}
    </div>
  );
}
```

## Option 2: Using the Hook

Add the shadow summary trigger to your existing summary generation logic:

```tsx
import { useShadowSummaryTrigger } from '../components/ShadowSummaryWrapper';

function ChatbotWizard({ user, ...props }) {
  // ... existing code ...

  // Add this hook
  const { triggerShadowSummary } = useShadowSummaryTrigger({
    profileId: user?.uid || '',
    userId: user?.uid || '',
    module: currentModuleData?.module || '',
    answers: moduleAnswers
  });

  // Modify your existing handleSummaryConsent function
  const handleSummaryConsent = async (text: string) => {
    // ... existing code ...

    if (moduleAnswers.length > 0) {
      setIsGeneratingSummary(true);
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Generating a summary of your responses..." },
      ]);
      
      try {
        // Generate the regular MVP summary
        await generateSummary(currentModuleData.module, moduleAnswers);
        
        // Trigger shadow summary in parallel (won't affect UI)
        triggerShadowSummary();
        
        if (onModuleComplete) {
          onModuleComplete(currentModuleData.module, moduleAnswers);
        }
      } catch {
        setMessages((msgs) => [
          ...msgs,
          { sender: "bot", text: "Sorry, I couldn't generate a summary right now. You can continue and we'll try again later." },
        ]);
      } finally {
        setIsGeneratingSummary(false);
      }
    }
    // ... rest of existing code ...
  };

  // ... rest of component ...
}
```

## Option 3: Minimal Integration

For the simplest integration, just add the hook call to your existing summary generation:

```tsx
// In your existing summary generation function
const handleSummaryConsent = async (text: string) => {
  // ... existing code ...

  if (moduleAnswers.length > 0) {
    setIsGeneratingSummary(true);
    
    try {
      // Generate regular summary
      await generateSummary(currentModuleData.module, moduleAnswers);
      
      // Add this single line to trigger shadow summary
      if (user) {
        const { generateShadowSummary } = useShadowSummary({
          profileId: user.uid,
          userId: user.uid
        });
        generateShadowSummary(currentModuleData.module, moduleAnswers);
      }
      
    } catch (error) {
      // ... error handling ...
    } finally {
      setIsGeneratingSummary(false);
    }
  }
};
```

## Environment Setup

Make sure to set the environment variable:

```bash
# .env.local
SUMMARY_SHADOW=true
```

## Verification

To verify shadow summaries are being generated:

1. Check the browser console for logs:
   - "Shadow summary generated and stored for [module]"
   - "METRIC: summary_v2_attempt_total = X"

2. Check the MongoDB `summaries_v2` collection for new documents

3. Test the ping endpoint:
   ```bash
   curl http://localhost:3000/api/v2/summary/ping
   ```

## Important Notes

- Shadow mode is OFF by default - set `SUMMARY_SHADOW=true` to enable
- Shadow summaries run in parallel and don't affect the UI
- If shadow generation fails, it won't affect the main MVP flow
- All shadow summaries are validated and linted before storage
- The feature is completely isolated from existing functionality
