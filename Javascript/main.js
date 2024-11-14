// Section 1
// Bar Chart - For a particular year and average a decade
// Function to fetch and parse CSV data from Our World in Data
const fetchCO2Data = async () => {
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const rawData = await response.text();
        const data = d3.csvParse(rawData, d3.autoType);

        // Select ten countries for comparison
        const selectedCountries = ["United States", "China", "India", "Russia", "Japan", "Germany", "Canada", "Brazil", "United Kingdom", "Australia"];

        // Filter data for the selected countries and relevant years
        const filteredData = data.filter(d => selectedCountries.includes(d.country) && (d.year === 2020 || (d.year >= 2010 && d.year <= 2020)));

        // Prepare data structure for chart: { country, year2020, decadeAvg }
        const chartData = selectedCountries.map(country => {
            const countryData = filteredData.filter(d => d.country === country);

            const year2020Data = countryData.find(d => d.year === 2020);
            const decadeData = countryData.filter(d => d.year >= 2010 && d.year <= 2020);

            return {
                country: country,
                year2020: year2020Data ? year2020Data.co2_per_capita : 0,
                decadeAvg: d3.mean(decadeData, d => d.co2_per_capita)
            };
        });

        renderBarChart(chartData);
    } catch (error) {
        console.error("Error fetching or parsing data:", error);
    }
};

// Function to render the bar chart with D3.js
const renderBarChart = (data) => {
    const chartContainer = d3.select("#bar-chart");
    chartContainer.selectAll("*").remove(); // Clear existing content

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    const svg = chartContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Flatten data for a grouped bar layout
    const flatData = [];
    data.forEach(d => {
        flatData.push({ country: d.country, label: "2020", value: d.year2020 });
        flatData.push({ country: d.country, label: "2010-2020 Avg", value: d.decadeAvg });
    });

    // Set up scales
    const x0 = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(["2020", "2010-2020 Avg"])
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(flatData, d => d.value)]).nice()
        .range([height - margin.bottom, margin.top]);

    // Define tooltip
		const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("opacity", 0);

    // Draw bars with tooltip
    svg.selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0(d.country)},0)`)
        .selectAll("rect")
        .data(d => [{ label: "2020", value: d.year2020 }, { label: "2010-2020 Avg", value: d.decadeAvg }])
        .enter()
        .append("rect")
        .attr("x", d => x1(d.label))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => y(0) - y(d.value))
        .attr("fill", d => d.label === "2020" ? "#00b4db" : "#0083b0")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Country: ${event.target.parentNode.__data__.country}<br>${d.label}: ${d.value.toFixed(2)} tons/capita`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Draw bars
    svg.selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0(d.country)},0)`)
        .selectAll("rect")
        .data(d => [{ label: "2020", value: d.year2020 }, { label: "2010-2020 Avg", value: d.decadeAvg }])
        .enter()
        .append("rect")
        .attr("x", d => x1(d.label))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => y(0) - y(d.value))
        .attr("fill", d => d.label === "2020" ? "#00b4db" : "#0083b0");

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add Y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
};

// Fetch data and render the chart
fetchCO2Data();


// Heatmap - For the year 2020
// Function to fetch and parse CSV data from Our World in Data
// Fetch and parse CSV data for both visualizations
const fetchCO2DataForVisualizations = async () => {
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const rawData = await response.text();
        const data = d3.csvParse(rawData, d3.autoType);

        // Define selected countries for both visualizations
        const selectedCountries = ["United States", "China", "India", "Russia", "Japan", "Germany", "Canada", "Brazil", "United Kingdom", "Australia"];

        // Filter data for the selected countries and relevant years for the bar chart
        const filteredDataForBarChart = data.filter(d => selectedCountries.includes(d.country) && (d.year === 2020 || (d.year >= 2010 && d.year <= 2020)));

        // Prepare data structure for the bar chart
        const barChartData = selectedCountries.map(country => {
            const countryData = filteredDataForBarChart.filter(d => d.country === country);

            const year2020Data = countryData.find(d => d.year === 2020);
            const decadeData = countryData.filter(d => d.year >= 2010 && d.year <= 2020);

            return {
                country: country,
                year2020: year2020Data ? year2020Data.co2_per_capita : 0,
                decadeAvg: d3.mean(decadeData, d => d.co2_per_capita)
            };
        });

        renderBarChartForCO2(barChartData);

        // Filter data for the selected countries for the heatmap (using 2020 data)
        const filteredDataForHeatmap = data.filter(d => selectedCountries.includes(d.country) && d.year === 2020);

        renderHeatmapForCO2(filteredDataForHeatmap);
    } catch (error) {
        console.error("Error fetching or parsing data:", error);
    }
};

// Function to render the bar chart with D3.js
const renderBarChartForCO2 = (data) => {
    const barChartContainer = d3.select("#bar-chart");
    barChartContainer.selectAll("*").remove(); // Clear existing content

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    const svgBar = barChartContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Flatten data for a grouped bar layout
    const flatDataBar = [];
    data.forEach(d => {
        flatDataBar.push({ country: d.country, label: "2020", value: d.year2020 });
        flatDataBar.push({ country: d.country, label: "2010-2020 Avg", value: d.decadeAvg });
    });

    // Set up scales
    const x0Bar = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const x1Bar = d3.scaleBand()
        .domain(["2020", "2010-2020 Avg"])
        .range([0, x0Bar.bandwidth()])
        .padding(0.05);

    const yBar = d3.scaleLinear()
        .domain([0, d3.max(flatDataBar, d => d.value)]).nice()
        .range([height - margin.bottom, margin.top]);

    // Define tooltip for bar chart
    const tooltipBar = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("opacity", 0);

    // Draw bars with tooltip
    svgBar.selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0Bar(d.country)},0)`)
        .selectAll("rect")
        .data(d => [{ label: "2020", value: d.year2020 }, { label: "2010-2020 Avg", value: d.decadeAvg }])
        .enter()
        .append("rect")
        .attr("x", d => x1Bar(d.label))
        .attr("y", d => yBar(d.value))
        .attr("width", x1Bar.bandwidth())
        .attr("height", d => yBar(0) - yBar(d.value))
        .attr("fill", d => d.label === "2020" ? "#00b4db" : "#0083b0")
        .on("mouseover", (event, d) => {
            tooltipBar.transition().duration(200).style("opacity", 0.9);
            tooltipBar.html(`Country: ${event.target.parentNode.__data__.country}<br>${d.label}: ${d.value.toFixed(2)} tons/capita`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            tooltipBar.transition().duration(500).style("opacity", 0);
        });

    // Add X-axis
    svgBar.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x0Bar))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add Y-axis
    svgBar.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yBar));
};

// Function to render the heatmap with D3.js
const renderHeatmapForCO2 = (data) => {
    const heatmapContainer = d3.select("#heatmap");
    heatmapContainer.selectAll("*").remove(); // Clear existing content

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    const svgHeatmap = heatmapContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Set up scales for heatmap
    const xHeatmap = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const yHeatmap = d3.scaleBand()
        .domain(["CO2 per Capita"])
        .range([height - margin.bottom, margin.top])
        .padding(0.1);

    const colorHeatmap = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data, d => d.co2_per_capita)]);

    // Define tooltip for heatmap
    const tooltipHeatmap = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("opacity", 0);

    // Draw heatmap cells
    svgHeatmap.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => xHeatmap(d.country))
        .attr("y", d => yHeatmap("CO2 per Capita"))
        .attr("width", xHeatmap.bandwidth())
        .attr("height", yHeatmap.bandwidth())
        .attr("fill", d => colorHeatmap(d.co2_per_capita))
        .on("mouseover", (event, d) => {
            tooltipHeatmap.transition().duration(200).style("opacity", 0.9);
            tooltipHeatmap.html(`Country: ${d.country}<br>CO₂ per Capita: ${d.co2_per_capita.toFixed(2)} tons`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            tooltipHeatmap.transition().duration(500).style("opacity", 0);
        });

    // Add X-axis
    svgHeatmap.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xHeatmap))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add Y-axis
    svgHeatmap.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yHeatmap));
};

// Fetch data and render both charts
fetchCO2DataForVisualizations();


// Stacked Bar Chart
// Function to fetch and parse CSV data for the stacked bar chart
const fetchCO2DataForCategoriesChart = async () => {
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const rawData = await response.text();
        const data = d3.csvParse(rawData, d3.autoType);

        // Define the top emitters for which we want to visualize categories
        const topEmitters = ["United States", "China", "India", "Russia", "Japan"];
        const year = 2020;

        // Filter data for the top emitters and the specified year
        const filteredData = data.filter(d => topEmitters.includes(d.country) && d.year === year);

        // Prepare data structure with default values for each category
        const chartData = filteredData.map(d => ({
            country: d.country,
            coal: d.coal_co2 || 0,
            oil: d.oil_co2 || 0,
            gas: d.gas_co2 || 0,
            cement: d.cement_co2 || 0,
            other: d.flaring_co2 || 0  // Use flaring as a proxy for "other" emissions
        }));

        renderCategoriesChart(chartData);
    } catch (error) {
        console.error("Error fetching or parsing data:", error);
    }
};

const renderCategoriesChart = (data) => {
    const chartContainer = d3.select("#emission-categories-chart");
    chartContainer.selectAll("*").remove(); // Clear existing content

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    const svg = chartContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Define color scale for each category
    const color = d3.scaleOrdinal()
        .domain(["coal", "oil", "gas", "cement", "other"])
        .range(["#4CAF50", "#FF5722", "#03A9F4", "#FFC107", "#9E9E9E"]);

    // Process data into stack format
    const stack = d3.stack()
        .keys(["coal", "oil", "gas", "cement", "other"])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const series = stack(data);

    // Define scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))]).nice()
        .range([height - margin.bottom, margin.top]);

    // Create groups for each series
    svg.append("g")
        .selectAll("g")
        .data(series)
        .enter()
        .append("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.country))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add Y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right - 120},${margin.top})`);

    color.domain().forEach((key, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(key));

        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 12)
            .text(key.charAt(0).toUpperCase() + key.slice(1));
    });
};

// Fetch data and render the emission categories chart
fetchCO2DataForCategoriesChart();



const fetchDataForHorizontalStackedBar = async () => {
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const rawData = await response.text();
        const data = d3.csvParse(rawData, d3.autoType);

        // Define selected countries for this chart
        const selectedCountries = ["United States", "China", "India", "Russia", "Japan", "Germany", "Canada", "Brazil", "United Kingdom", "Australia"];

        // Filter data for the selected countries for 2020
        const filteredData = data.filter(d => selectedCountries.includes(d.country) && d.year === 2020);

        // Prepare data for each category
        const chartData = filteredData.map(d => ({
            country: d.country,
            coal: d.coal_co2 || 0,
            oil: d.oil_co2 || 0,
            gas: d.gas_co2 || 0,
            cement: d.cement_co2 || 0,
            other: d.other_co2 || 0,
            total: (d.coal_co2 || 0) + (d.oil_co2 || 0) + (d.gas_co2 || 0) + (d.cement_co2 || 0) + (d.other_co2 || 0)
        }));

        // Sort data by total emissions
        chartData.sort((a, b) => b.total - a.total);

        renderHorizontalStackedBarChart(chartData);
    } catch (error) {
        console.error("Error fetching or parsing data:", error);
    }
};

const renderHorizontalStackedBarChart = (data) => {
    const chartContainer = d3.select("#horizontal-stacked-bar-chart");
    chartContainer.selectAll("*").remove(); // Clear existing content

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 150, bottom: 50, left: 100 };

    const svg = chartContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define color scale for each category
    const color = d3.scaleOrdinal()
        .domain(["coal", "oil", "gas", "cement", "other"])
        .range(["#4CAF50", "#FF5722", "#03A9F4", "#FFC107", "#9E9E9E"]);

    // Set up stack generator
    const stack = d3.stack()
        .keys(["coal", "oil", "gas", "cement", "other"]);

    const series = stack(data);

    // Define scales
    const y = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, height])
        .padding(0.1);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total)]).nice()
        .range([0, width]);

    // Draw the bars
    svg.selectAll("g")
        .data(series)
        .enter()
        .append("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("y", d => y(d.data.country))
        .attr("x", d => x(d[0]))
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("height", y.bandwidth());

    // Add Y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d} t`));

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20},0)`);

    color.domain().forEach((key, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(key));

        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 12)
            .text(key.charAt(0).toUpperCase() + key.slice(1));
    });
};

// Fetch data and render the horizontal stacked bar chart
fetchDataForHorizontalStackedBar();


// Stacked Bar Chart 100%
// Fetch data and render the 100% stacked bar chart
const fetchAndRenderStackedBarChart100 = async () => {
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const rawData = await response.text();
        const data = d3.csvParse(rawData, d3.autoType);

        // Define selected countries and categories for the chart
        const selectedCountries = ["United States", "China", "India", "Russia", "Japan", "Germany", "Canada", "Brazil", "United Kingdom", "Australia"];
        const categories = ["coal_co2", "oil_co2", "gas_co2", "cement_co2", "other_industry_co2"];

        // Filter data for the selected countries and year 2020
        const filteredData = data.filter(d => selectedCountries.includes(d.country) && d.year === 2020);

        // Prepare data structure for 100% stacked bar chart
        const chartData = filteredData.map(d => {
            const total = categories.reduce((sum, cat) => sum + (d[cat] || 0), 0);
            return {
                country: d.country,
                categories: categories.map(cat => ({
                    category: cat,
                    value: total > 0 ? (d[cat] || 0) / total : 0 // Calculate as percentage of total
                }))
            };
        });

        renderStackedBarChart100(chartData);
    } catch (error) {
        console.error("Error fetching or parsing data:", error);
    }
};

// Function to render the 100% stacked bar chart with D3.js
const renderStackedBarChart100 = (data) => {
    const chartContainer = d3.select("#stacked-bar-chart-100");
    chartContainer.selectAll("*").remove(); // Clear existing content

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    const svg = chartContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(["coal_co2", "oil_co2", "gas_co2", "cement_co2", "other_industry_co2"])
        .range(["#FF5733", "#FFC300", "#DAF7A6", "#C70039", "#900C3F"]);

    const stack = d3.stack()
        .keys(["coal_co2", "oil_co2", "gas_co2", "cement_co2", "other_industry_co2"])
        .value((d, key) => d.categories.find(cat => cat.category === key)?.value || 0);

    const stackedData = stack(data);

    // Draw bars
    svg.selectAll("g")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.country))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add Y-axis as percentage
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(10, "%"));

    // Legend
    const legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(d => d.replace("_co2", "").toUpperCase());
};

// Fetch data and render the 100% stacked bar chart
fetchAndRenderStackedBarChart100();

// Waffle Chart 
// Fetch data and render the waffle chart
const fetchAndRenderWaffleChart = async () => {
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const rawData = await response.text();
        const data = d3.csvParse(rawData, d3.autoType);

        // Define selected countries and categories for the chart
        const selectedCountries = ["United States", "China", "India", "Russia", "Japan", "Germany", "Canada", "Brazil", "United Kingdom", "Australia"];
        const categories = ["coal_co2", "oil_co2", "gas_co2", "cement_co2", "other_industry_co2"];
        
        // Colors for each category
        const colorScale = d3.scaleOrdinal()
            .domain(categories)
            .range(["#FF5733", "#FFC300", "#DAF7A6", "#C70039", "#900C3F"]);

        // Filter data for the selected countries and year 2020
        const filteredData = data.filter(d => selectedCountries.includes(d.country) && d.year === 2020);

        // Prepare data structure for waffle chart
        const waffleData = filteredData.map(d => {
            const total = categories.reduce((sum, cat) => sum + (d[cat] || 0), 0);
            const squares = [];
            categories.forEach(cat => {
                const count = Math.round(((d[cat] || 0) / total) * 100);
                for (let i = 0; i < count; i++) {
                    squares.push({ category: cat });
                }
            });
            return { country: d.country, squares };
        });

        renderWaffleChart(waffleData, colorScale);
    } catch (error) {
        console.error("Error fetching or parsing data:", error);
    }
};

// Function to render the waffle chart with D3.js
const renderWaffleChart = (data, colorScale) => {
    const chartContainer = d3.select("#waffle-chart");
    chartContainer.selectAll("*").remove(); // Clear existing content

    const squareSize = 15;
    const squaresPerRow = 10;
    const padding = 5;

    data.forEach((countryData, countryIndex) => {
        const countryGroup = chartContainer.append("div")
            .attr("class", "country-waffle")
            .style("display", "inline-block")
            .style("margin", "20px")
            .style("width", `${squareSize * squaresPerRow + padding * (squaresPerRow - 1)}px`);

        // Country label
        countryGroup.append("div")
            .text(countryData.country)
            .style("text-align", "center")
            .style("margin-bottom", "10px")
            .style("font-weight", "bold");

        const svg = countryGroup.append("svg")
            .attr("width", squareSize * squaresPerRow + padding * (squaresPerRow - 1))
            .attr("height", squareSize * squaresPerRow + padding * (squaresPerRow - 1));

        svg.selectAll("rect")
            .data(countryData.squares)
            .enter()
            .append("rect")
            .attr("width", squareSize)
            .attr("height", squareSize)
            .attr("x", (d, i) => (i % squaresPerRow) * (squareSize + padding))
            .attr("y", (d, i) => Math.floor(i / squaresPerRow) * (squareSize + padding))
            .attr("fill", d => colorScale(d.category))
            .append("title")
            .text(d => `Category: ${d.category.replace("_co2", "").toUpperCase()}`);
    });

    // Legend
    const legendContainer = chartContainer.append("div")
        .attr("class", "legend")
        .style("margin-top", "20px");

    legendContainer.selectAll("div")
        .data(colorScale.domain())
        .enter()
        .append("div")
        .style("display", "inline-block")
        .style("margin-right", "10px")
        .style("padding", "5px")
        .style("background-color", d => colorScale(d))
        .text(d => d.replace("_co2", "").toUpperCase());
};

// Fetch data and render the waffle chart
fetchAndRenderWaffleChart();

// Section 2
// Alluvial
const renderAlluvialManually = (nodes, links) => {
    console.log("Rendering manual alluvial chart...");

    const svgWidth = 800;
    const svgHeight = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 50 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Remove existing SVG
    d3.select("#alluvial-diagram").selectAll("*").remove();

    const svg = d3
        .select("#alluvial-diagram")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const chart = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Node positions
    const levelSpacing = width / 3; // Space between levels
    const nodeHeight = 30;
    const nodePadding = 10;

    const levels = {
        continent: 0,
        country: 1,
        category: 2,
    };

    // Scale for positioning nodes vertically within levels
    const levelCounts = { continent: 0, country: 0, category: 0 };
    const verticalSpacing = height / 10;

    const nodePositions = {};
    nodes.forEach((node) => {
        const level = levels[node.type];
        nodePositions[node.id] = {
            x: level * levelSpacing,
            y: levelCounts[node.type] * verticalSpacing + nodePadding,
        };
        levelCounts[node.type] += 1;
    });

    console.log("Node Positions:", nodePositions);

    // Draw links
    chart
        .selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", (d) => {
            const source = nodePositions[d.source];
            const target = nodePositions[d.target];
            return `M${source.x + 10},${source.y + nodeHeight / 2}C${(source.x +
                target.x) / 2},${source.y + nodeHeight / 2} ${(source.x + target.x) / 2},${target.y +
                nodeHeight / 2} ${target.x},${target.y + nodeHeight / 2}`;
        })
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", (d) => Math.max(2, d.value / 1000)) // Scale for visual clarity
        .attr("opacity", 0.8);

    console.log("Links Rendered:", links);

    // Draw nodes
    chart
        .selectAll(".node")
        .data(nodes)
        .enter()
        .append("rect")
        .attr("class", "node")
        .attr("x", (d) => nodePositions[d.id].x)
        .attr("y", (d) => nodePositions[d.id].y)
        .attr("width", 100)
        .attr("height", nodeHeight)
        .attr("fill", (d) => {
            if (d.type === "continent") return "#66c2a5";
            if (d.type === "country") return "#fc8d62";
            return "#8da0cb";
        });

    // Add node labels
    chart
        .selectAll(".label")
        .data(nodes)
        .enter()
        .append("text")
        .attr("x", (d) => nodePositions[d.id].x + 10)
        .attr("y", (d) => nodePositions[d.id].y + nodeHeight / 2 + 5)
        .attr("fill", "#000")
        .attr("font-size", 12)
        .text((d) => d.id);
};

const fetchAndRenderAlluvial = async () => {
    console.log("Fetching data...");

    try {
        const response = await fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv");
        const rawData = await response.text();
        const data = d3.csvParse(rawData, d3.autoType);

        console.log("Data fetched successfully.");

        // Map country to continent (adjust to match your dataset)
        const countryToContinent = {
            "United States": "North America",
            Canada: "North America",
            Brazil: "South America",
            China: "Asia",
            India: "Asia",
            Russia: "Europe",
            Germany: "Europe",
            "United Kingdom": "Europe",
            Japan: "Asia",
            Australia: "Oceania",
        };

        const nodes = [];
        const links = [];
        const nodeIds = new Set();

        // Create nodes and links
        Object.entries(countryToContinent).forEach(([country, continent]) => {
            if (!nodeIds.has(continent)) {
                nodes.push({ id: continent, type: "continent" });
                nodeIds.add(continent);
            }
            if (!nodeIds.has(country)) {
                nodes.push({ id: country, type: "country" });
                nodeIds.add(country);
            }
            const countryData = data.find((d) => d.country === country && d.year === 2020);
            const totalCO2 = countryData ? countryData.co2 || 0 : 0;

            links.push({ source: continent, target: country, value: totalCO2 });

            ["coal_co2", "oil_co2", "gas_co2", "cement_co2", "land_use_change_co2"].forEach((category) => {
                if (!nodeIds.has(category)) {
                    nodes.push({ id: category, type: "category" });
                    nodeIds.add(category);
                }
                if (countryData && countryData[category]) {
                    links.push({
                        source: country,
                        target: category,
                        value: countryData[category],
                    });
                }
            });
        });

        console.log("Processed Nodes:", nodes);
        console.log("Processed Links:", links);

        renderAlluvialManually(nodes, links);
    } catch (error) {
        console.error("Error fetching or parsing data:", error);
    }
};

// Trigger rendering
fetchAndRenderAlluvial();
