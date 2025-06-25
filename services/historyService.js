const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/user-summaries.json'); // Renamed file for clarity

// Ensure the file exists with an empty object
function initializeStore() {
    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, JSON.stringify({}, null, 2));
    }
}
initializeStore();

async function updateUserSummary(sender, newSummary) {
  try {
    const allUserData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    allUserData[sender] = {
      summary: newSummary,
      lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(dataFilePath, JSON.stringify(allUserData, null, 2));
  } catch (error) {
    console.error(`❌ Error updating summary for ${sender}:`, error);
    // Re-initialize if file was corrupted or deleted mid-operation, then retry once
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
        console.warn('Re-initializing user summaries store and retrying update.');
        initializeStore();
        try {
            const freshUserData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
            freshUserData[sender] = {
                summary: newSummary,
                lastUpdated: new Date().toISOString(),
            };
            fs.writeFileSync(dataFilePath, JSON.stringify(freshUserData, null, 2));
        } catch (retryError) {
            console.error(`❌ Retry updating summary for ${sender} also failed:`, retryError);
            throw retryError; // Propagate error if retry fails
        }
    } else {
        throw error; // Propagate other errors
    }
  }
}

async function getLatestSummary(sender) {
  try {
    const allUserData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    return allUserData[sender]?.summary || ""; // Return empty string if no summary or sender
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      console.warn(`User summaries file not found or unparseable for ${sender}, returning empty summary.`);
      initializeStore(); // Ensure file exists for next operations
      return "";
    }
    console.error(`❌ Error getting latest summary for ${sender}:`, error);
    throw error;
  }
}

async function clearUserSummary(sender) {
  try {
    const allUserData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    if (allUserData[sender]) {
      delete allUserData[sender];
      fs.writeFileSync(dataFilePath, JSON.stringify(allUserData, null, 2));
      console.log(`🗑️ Cleared summary for sender: ${sender}`);
    } else {
      console.log(`ℹ️ No summary to clear for sender: ${sender}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
        console.warn('User summaries file not found or unparseable during clear, ensuring it exists now.');
        initializeStore();
        return; // Nothing to clear if file was bad/missing
    }
    console.error(`❌ Error clearing summary for ${sender}:`, error);
    throw error;
  }
}

async function mergeUserSummaries(fromId, toId) {
  try {
    const allUserData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    if (!allUserData[fromId]) {
      console.log(`⚠️ No summary data to merge from ${fromId}.`);
      return;
    }

    const fromData = allUserData[fromId];
    const toData = allUserData[toId];

    // Strategy: The summary from `fromId` (tempId) is usually the most current conversation.
    // Overwrite `toId`'s summary if `fromId`'s summary exists and is more recent or `toId` has no summary.
    let mergedSuccessfully = false;
    if (fromData && fromData.summary) {
        if (!toData || !toData.summary || new Date(fromData.lastUpdated) >= new Date(toData?.lastUpdated || 0)) {
            allUserData[toId] = { // Ensure toId entry exists
                summary: fromData.summary,
                lastUpdated: fromData.lastUpdated,
            };
            mergedSuccessfully = true;
        } else {
            // toId has a more recent or equally recent summary, keep toId's summary.
            // This case might need more sophisticated logic if summaries should be combined by AI.
            // For now, `fromId`'s data is essentially discarded if `toId` is more "up-to-date".
            console.log(`ℹ️ Summary for ${toId} is newer or same as ${fromId}. Not overwriting ${toId}'s summary.`);
        }
    } else if (fromData && !fromData.summary && toData && !toData.summary){
        // both from and to have no summary, ensure `toId` has a lastUpdated if it exists
        if(allUserData[toId]){
            allUserData[toId].lastUpdated = new Date().toISOString(); // or fromData.lastUpdated
        } else {
            allUserData[toId] = { summary: "", lastUpdated: new Date().toISOString() };
        }
    }


    // Delete temp (fromId) data only if it was successfully merged or its data was older
    delete allUserData[fromId];
    fs.writeFileSync(dataFilePath, JSON.stringify(allUserData, null, 2));

    if (mergedSuccessfully) {
        console.log(`✅ Merged summary from ${fromId} to ${toId}.`);
    } else {
        console.log(`ℹ️ Summary merge from ${fromId} to ${toId} resulted in no change to ${toId}'s summary. ${fromId} data removed.`);
    }

  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
        console.warn('User summaries file not found or unparseable during merge, ensuring it exists now.');
        initializeStore();
        return; // Cannot merge if file was bad/missing
    }
    console.error('❌ Error merging user summaries:', error);
    throw error;
  }
}

module.exports = {
  updateUserSummary,
  getLatestSummary,
  clearUserSummary,
  mergeUserSummaries,
};