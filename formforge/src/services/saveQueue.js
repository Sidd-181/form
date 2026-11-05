export function createLatestSaveQueue(persist) {
    let latest;
    let revision = 0;
    let savedRevision = 0;
    let inFlight = null;
    return {
        setLatest(snapshot) {
            latest = snapshot;
            revision += 1;
        },
        isSaved() {
            return savedRevision === revision;
        },
        flush() {
            if (inFlight)
                return inFlight;
            inFlight = (async () => {
                while (savedRevision < revision) {
                    const savingRevision = revision;
                    const snapshot = latest;
                    try {
                        await persist(snapshot);
                        savedRevision = savingRevision;
                    }
                    catch (error) {
                        if (revision === savingRevision)
                            throw error;
                    }
                }
            })().finally(() => { inFlight = null; });
            return inFlight;
        },
    };
}
