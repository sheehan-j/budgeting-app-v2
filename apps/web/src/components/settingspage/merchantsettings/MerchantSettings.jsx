import { useState, useRef, useEffect } from "react";
import { useDataStore } from "../../../util/dataStore";
import { useMerchantSettingsQuery } from "../../../queries/useMerchantSettingsQuery";
import { useCategoriesQuery } from "../../../queries/useCategoriesQuery";
import { useApplyMerchantSettingsMutation } from "../../../mutations/useApplyMerchantSettingsMutation";
import MerchantSettingsItem from "./MerchantSettingsItem";
import MerchantSettingsItemCreate from "./MerchantSettingsItemCreate";
import ButtonSpinner from "../../common/ButtonSpinner";

const MerchantSettings = () => {
	const { editingMerchantSetting, setEditingMerchantSetting, scrollToNewMerchantSetting, setScrollToNewMerchantSetting, setNotification } = useDataStore((state) => ({
		editingMerchantSetting: state.editingMerchantSetting,
		setEditingMerchantSetting: state.setEditingMerchantSetting,
    scrollToNewMerchantSetting: state.scrollToNewMerchantSetting,
    setScrollToNewMerchantSetting: state.setScrollToNewMerchantSetting,
		setNotification: state.setNotification,
	}));
	const [loading, setLoading] = useState({
		save: false,
		delete: false,
		create: false,
		apply: false,
	});
	const [merchantSearch, setMerchantSearch] = useState("");
	const bottomRef = useRef(null);

	const { data: categories, isLoading: categoriesLoading } = useCategoriesQuery();
	const { data: merchantSettings, isLoading: merchantSettingsLoading } = useMerchantSettingsQuery();
	const applyMerchantSettingsMutation = useApplyMerchantSettingsMutation();
	const filteredMerchantSettings =
		merchantSettings?.filter((m) => m.text.toLowerCase().includes(merchantSearch.toLowerCase())) ?? [];

  useEffect(() => {
    if (scrollToNewMerchantSetting) {
      setTimeout(() => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
        setScrollToNewMerchantSetting(false);
      }, 100);
    }
  }, [scrollToNewMerchantSetting, setScrollToNewMerchantSetting]);

	const onClickCreate = () => {
		if (Object.values(loading).some((value) => value)) return;

		if (editingMerchantSetting?.id === -1) {
			setEditingMerchantSetting(null);
			return;
		}
		setEditingMerchantSetting({ id: -1, category: { name: "Uncategorized" }, text: "", type: "contains" });
		setScrollToNewMerchantSetting(true);
	};

	const onClickApplyToExisting = async () => {
		if (Object.values(loading).some((value) => value) || applyMerchantSettingsMutation.isPending) return;

		setLoading({ ...loading, apply: true });

		applyMerchantSettingsMutation.mutate(undefined, {
			onSuccess: (updatedCount) => {
				setLoading({ ...loading, apply: false });

				setNotification({
					type: "success",
					message:
						updatedCount === 0
							? "No existing transactions needed updates."
							: `Applied merchant settings to ${updatedCount} transaction${updatedCount === 1 ? "" : "s"}.`,
				});
			},
			onError: () => {
				setLoading({ ...loading, apply: false });
				setNotification({
					type: "error",
					message: "Could not apply merchant settings to existing transactions.",
				});
			},
		});
	};

	return (
		<>
			{!categoriesLoading && !merchantSettingsLoading && (
				<div className="grow flex flex-col">
					<div className="grow overflow-y-auto p-6">
						<div className="flex justify-between items-center flex-wrap mb-3">
							<div className="text-lg text-slate-600 font-semibold">Merchants</div>
							<div className="w-52 flex items-center border border-slate-300 rounded p-0.5">
								<input
									value={merchantSearch}
									onChange={(e) => setMerchantSearch(e.target.value)}
									placeholder="Search merchants"
									className="grow text-xs outline-none bg-transparent pl-1"
								></input>
								<div className="w-5 p-0.5 mr-0.5">
									<img src="./search.svg" className="w-full h-full" />
								</div>
							</div>
						</div>
						<div className="flex flex-col gap-3">
							{merchantSettings?.length === 0 && editingMerchantSetting?.id !== -1 && (
								<div className="w-full border border-slate-300 rounded flex justify-center items-center py-3">
									{"No merchants saved :("}
								</div>
							)}
							{filteredMerchantSettings.map((item, index) => (
									<MerchantSettingsItem
										merchantSettings={merchantSettings}
										key={index}
										item={item}
										loading={loading}
										setLoading={setLoading}
										categories={categories}
									/>
								))}
							{merchantSettings?.length > 0 && filteredMerchantSettings.length === 0 && (
								<div className="w-full border border-slate-300 rounded flex justify-center items-center py-3">
									{"No search results found :("}
								</div>
							)}
							{editingMerchantSetting?.id === -1 && (
								<MerchantSettingsItemCreate
									merchantSettings={merchantSettings}
									loading={loading}
									setLoading={setLoading}
									categories={categories}
								/>
							)}
						</div>
						<div ref={bottomRef}></div>
					</div>
					<div className="border-t border-slate-300 w-full flex justify-between px-8 py-4">
						<button
							onClick={onClickApplyToExisting}
							className="border-slate-200 relative text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-1 border-slate-300 border rounded"
						>
							<span className={`${loading.apply ? "opacity-0" : ""}`}>
								Apply to Existing Transactions
							</span>
							{loading.apply && <ButtonSpinner />}
						</button>
						{editingMerchantSetting?.id === -1 ? (
							<div className="flex justify-start items-start">
								<button
									onClick={onClickCreate}
									className="border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-1 border-slate-300 border rounded"
								>
									Cancel
								</button>
							</div>
						) : (
							<button
								className="relative bg-blue-100 py-1 px-2 bg-cGreen-light border border-slate-300 rounded text-sm text-slate-700 p-1"
								onClick={onClickCreate}
							>
								Create
							</button>
						)}
					</div>
				</div>
			)}
		</>
	);
};

export default MerchantSettings;
