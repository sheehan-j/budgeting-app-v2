const bannerLetters = {
	M: ["##   ##", "### ###", "#######", "## # ##", "##   ##", "##   ##", "##   ##", "##   ##"],
	I: ["#######", "   #   ", "   #   ", "   #   ", "   #   ", "   #   ", "   #   ", "#######"],
	K: ["##   ##", "##  ## ", "## ##  ", "####   ", "####   ", "## ##  ", "##  ## ", "##   ##"],
	A: ["  ###  ", " ## ## ", "##   ##", "##   ##", "#######", "##   ##", "##   ##", "##   ##"],
	L: ["##     ", "##     ", "##     ", "##     ", "##     ", "##     ", "##     ", "#######"],
};

const bannerRows = Array.from({ length: bannerLetters.M.length }, (_, rowIndex) =>
	["M", "I", "K", "A", "L"]
		.map((letter) => bannerLetters[letter as keyof typeof bannerLetters][rowIndex])
		.join("   "),
);

const renderedBanner = bannerRows.flatMap((row) => {
	const renderedRow = `====${row
		.split("")
		.map((character) => (character === "#" ? "  " : "=="))
		.join("")}====`;

	return [renderedRow, renderedRow];
});

const firstRow = renderedBanner[0];

export const startupBanner = firstRow
	? ["", "=".repeat(firstRow.length), ...renderedBanner, "=".repeat(firstRow.length), ""]
	: [];


