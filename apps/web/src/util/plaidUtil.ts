export const formatPlaidSyncSuccessNotification = (items) => {
	const totalChanges = items.reduce((sum, item) => sum + item.addedCount + item.modifiedCount + item.removedCount, 0);

  let message;

	if (items.length === 0) {
		message = "No connected institutions to sync yet.";
	}

	if (totalChanges === 0) {
		message = `Synced ${items.length} institution${items.length === 1 ? "" : "s"}. No transaction changes were needed.`;
	}

	message = `Synced ${items.length} institution${items.length === 1 ? "" : "s"} with ${totalChanges} total transaction change${totalChanges === 1 ? "" : "s"}.`;

  return {
    type: "success",
    message
  }
};
