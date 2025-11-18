# 🧪 Manual Testing Checklist

Use this checklist to manually verify the sentence learning feature works in your browser.

---

## ✅ Basic Navigation Test

- [ ] Open `index.html` in a web browser
- [ ] Look at the bottom navigation bar
- [ ] Verify you see 5 tabs: Home, **Sentences** (📚), Words, Practice, Profile
- [ ] Click on the **Sentences** tab
- [ ] Verify the Sentences screen loads

**Expected Result**: You should see the sentence learning main screen with 3 stat cards.

---

## ✅ Daily Learning Flow Test

### Test 1: Start First Learning Session
- [ ] Click the **"Start Learning Today"** button
- [ ] Verify you see the first sentence in Lithuanian
- [ ] Check that all elements are visible:
  - [ ] Category badge (e.g., "Greetings")
  - [ ] Difficulty badge (e.g., "beginner")
  - [ ] Lithuanian text
  - [ ] 🔊 Listen button
  - [ ] Pronunciation guide
  - [ ] English translation
  - [ ] "Got it! Next Sentence →" button

### Test 2: Audio Playback
- [ ] Click the **🔊 Listen** button
- [ ] Verify audio plays (text-to-speech)
- [ ] Note: If no audio, that's OK (browser may not support it)

### Test 3: Mark Sentence as Learned
- [ ] Click **"Got it! Next Sentence →"**
- [ ] Verify you move to the next sentence
- [ ] Check the progress bar at the top increases

### Test 4: Complete Learning Session
- [ ] Continue clicking through sentences
- [ ] Complete all 10 sentences
- [ ] Verify you see the results screen showing:
  - [ ] Number of sentences learned
  - [ ] XP earned (should be 50 XP for 10 sentences)
  - [ ] Total sentences mastered
- [ ] Click **"Continue"**
- [ ] Verify you return to the main Sentences screen

### Test 5: Daily Limit
- [ ] After completing 10 sentences, verify you see:
  - [ ] "Daily Goal Complete!" message
  - [ ] 10/10 in "Today's Progress" card
  - [ ] Cannot start new learning session today

---

## ✅ Progress Tracking Test

- [ ] Check "Today's Progress" card shows 10/10
- [ ] Check "Total Learned" card shows 10
- [ ] Scroll down to see "Your Progress" section
- [ ] Verify "Week 1" progress bar shows 10/10

---

## ✅ Weekly Review Test (Simulated)

**Note**: Weekly review normally triggers after 7 days. For testing, you can manually edit localStorage:

### Option A: Wait 7 Days
- [ ] Come back after 7 days
- [ ] Verify you see a "Weekly Review Time!" banner
- [ ] Click **"Start Weekly Review"**

### Option B: Manual Trigger (Advanced)
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run this code:
```javascript
const data = Storage.getUserData();
data.sentences.weeklyReviewDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
Storage.saveUserData(data);
location.reload();
```
4. [ ] Verify review banner appears
5. [ ] Click **"Start Weekly Review"**

### Review Test Steps
- [ ] Verify you see a multiple-choice question
- [ ] Read the question (translate Lithuanian or English)
- [ ] Click on an answer option
- [ ] Verify you get immediate feedback (green/red)
- [ ] Wait for auto-advance to next question
- [ ] Complete all review questions
- [ ] Verify results screen shows:
  - [ ] Correct/Total answers
  - [ ] XP earned
  - [ ] Accuracy percentage
- [ ] Click **"Back to Sentences"**

---

## ✅ Navigation Test

### Exit During Learning
- [ ] Start a learning session
- [ ] Click the **✕** button at top-left
- [ ] Verify you see a confirmation dialog
- [ ] Click "Cancel" - verify you stay in session
- [ ] Click **✕** again and "OK" - verify you return to main screen

### Screen Switching
- [ ] Click on different tabs (Home, Words, Practice)
- [ ] Return to Sentences tab
- [ ] Verify your progress is saved

---

## ✅ XP Integration Test

- [ ] Note your current total XP (check Home screen)
- [ ] Learn 1 sentence (should earn 5 XP)
- [ ] Go to Home screen
- [ ] Verify your total XP increased by 5
- [ ] Check if daily XP goal progress updated

---

## ✅ Responsive Design Test

### Desktop
- [ ] View on desktop browser (full screen)
- [ ] Verify layout looks good

### Mobile
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (mobile view)
- [ ] Test on iPhone/Android screen size
- [ ] Verify:
  - [ ] Navigation bar is accessible
  - [ ] Buttons are tap-friendly
  - [ ] Text is readable
  - [ ] Cards stack properly

---

## ✅ Data Persistence Test

- [ ] Learn a few sentences
- [ ] Close the browser tab
- [ ] Reopen `index.html`
- [ ] Go to Sentences tab
- [ ] Verify your progress was saved:
  - [ ] Today's Progress shows correct count
  - [ ] Total Learned shows correct count
  - [ ] Cannot re-learn already learned sentences

---

## ✅ Edge Case Tests

### Test Empty State
- [ ] Clear localStorage (DevTools → Application → Local Storage → Clear)
- [ ] Reload page
- [ ] Go through onboarding if it appears
- [ ] Go to Sentences tab
- [ ] Verify shows 0/10 progress and allows learning

### Test Daily Reset (Next Day)
- [ ] Complete 10 sentences today
- [ ] Change system date to tomorrow (or wait until tomorrow)
- [ ] Reload page
- [ ] Go to Sentences tab
- [ ] Verify:
  - [ ] "Today's Progress" reset to 0/10
  - [ ] "Total Learned" still shows 10
  - [ ] Can learn 10 new sentences

---

## 🐛 Bug Reporting

If you find any issues, note:
1. **What you did**: [describe steps]
2. **What you expected**: [expected behavior]
3. **What happened**: [actual behavior]
4. **Browser**: [Chrome/Firefox/Safari + version]
5. **Console errors**: [open DevTools → Console, copy any red errors]

---

## ✅ Test Results Summary

**Date Tested**: _______________  
**Browser**: _______________  
**All Tests Passed**: [ ] YES / [ ] NO  

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## 🎉 If All Tests Pass...

Congratulations! Your daily sentence learning feature is working perfectly!

**Next Steps**:
1. Start learning 10 sentences per day
2. Come back daily for new content
3. Complete weekly reviews to reinforce learning
4. Track your progress over time

**Linksmų mokslų!** (Happy learning!) 🇱🇹
