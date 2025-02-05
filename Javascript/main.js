// Section 1
// Bar Chart - For a particular year and average a decade
// Function to fetch and parse CSV data from Our World in Data
const fetchCO2Data = async () => {
    // Define the URL to fetch CO₂ data from the GitHub repository
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";
    
    try {
        // Fetch the CSV data from the URL
        const response = await fetch(url);
        
        // Read the response as text (CSV format)
        const rawData = await response.text();

        // Parse the CSV data using D3.js with automatic type conversion
        const data = d3.csvParse(rawData, d3.autoType);

        // Define an array of selected countries to include in the visualization
        const selectedCountries = ["United States", "China", "India", "Russia", "Japan", "Germany", "Canada", "Brazil", "United Kingdom", "Australia"];

        // Filter the data for the selected countries and the years 2020 or within the range 2010 to 2020
        const filteredData = data.filter(d => 
            selectedCountries.includes(d.country) && 
            (d.year === 2020 || (d.year >= 2010 && d.year <= 2020))
        );

        // Prepare the chart data by calculating relevant statistics for each country
        const chartData = selectedCountries.map(country => {
            // Filter data for the current country
            const countryData = filteredData.filter(d => d.country === country);

            // Find the data entry for the year 2020
            const year2020Data = countryData.find(d => d.year === 2020);

            // Filter data for the years in the 2010-2020 decade
            const decadeData = countryData.filter(d => d.year >= 2010 && d.year <= 2020);

            // Return an object containing the country name, CO₂ per capita for 2020, and the decade average
            return {
                country: country,
                year2020: year2020Data ? year2020Data.co2_per_capita : 0,  // Handle missing data by using 0
                decadeAvg: d3.mean(decadeData, d => d.co2_per_capita)  // Calculate average CO₂ per capita for the decade
            };
        });

        // Call the function to render the bar chart with the prepared data
        renderBarChart(chartData);
    } catch (error) {
        // Log an error message if there was an issue with fetching or parsing the data
        console.error("Error fetching or parsing data:", error);
    }
};


// Function to render the bar chart with D3.js
const renderBarChart = (data) => {
    // Select the chart container element and remove any existing content
    const chartContainer = d3.select("#bar-chart");
    chartContainer.selectAll("*").remove(); 

    // Set chart dimensions and margins
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    // Append an SVG element to the chart container with the specified width and height
    const svg = chartContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Prepare the data for grouped bar layout by flattening it into individual entries
    const flatData = [];
    data.forEach(d => {
        flatData.push({ country: d.country, label: "2020", value: d.year2020 });
        flatData.push({ country: d.country, label: "2010-2020 Avg", value: d.decadeAvg });
    });

    // Set up the primary X-axis scale for countries
    const x0 = d3.scaleBand()
        .domain(data.map(d => d.country))  // Map each country to a band position
        .range([margin.left, width - margin.right])  // Define the range of the axis
        .padding(0.2);  // Add padding between country groups

    // Set up the secondary X-axis scale for labels ("2020" and "2010-2020 Avg")
    const x1 = d3.scaleBand()
        .domain(["2020", "2010-2020 Avg"])
        .range([0, x0.bandwidth()])  // Fit within each country's band
        .padding(0.05);  // Add slight padding between bars within a group

    // Set up the Y-axis scale based on the maximum value in the data
    const y = d3.scaleLinear()
        .domain([0, d3.max(flatData, d => d.value)]).nice()  // Add some padding to the top of the scale
        .range([height - margin.bottom, margin.top]);  // Invert the range for proper bar height

    // Define a tooltip for displaying information on hover
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("opacity", 0);

    // Draw bars with tooltip functionality
    svg.selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0(d.country)},0)`)  // Position each group by country
        .selectAll("rect")
        .data(d => [{ label: "2020", value: d.year2020 }, { label: "2010-2020 Avg", value: d.decadeAvg }])
        .enter()
        .append("rect")
        .attr("x", d => x1(d.label))  // Position each bar within its group
        .attr("y", d => y(d.value))  // Set the top of the bar based on the value
        .attr("width", x1.bandwidth())  // Set the bar width
        .attr("height", d => y(0) - y(d.value))  // Set the bar height based on the value
        .attr("fill", d => d.label === "2020" ? "#00b4db" : "#0083b0")  // Assign color based on the label
        .on("mouseover", (event, d) => {
            // Show tooltip on mouseover
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Country: ${event.target.parentNode.__data__.country}<br>${d.label}: ${d.value.toFixed(2)} tons/capita`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            // Hide tooltip on mouseout
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Draw the X-axis (country labels)
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x0))  // Attach the axis to the bottom of the chart
        .selectAll("text")
        .attr("transform", "rotate(-45)")  // Rotate the text for readability
        .style("text-anchor", "end");  // Align text to the end of the rotation

    // Draw the Y-axis (values)
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));  // Attach the axis to the left of the chart
};

// Fetch data and render the chart
fetchCO2Data();


// Function to fetch and parse CSV data from Our World in Data for both visualizations
const fetchCO2DataForVisualizations = async () => {
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"; // URL for CO2 data CSV

    try {
        // Fetch data from the URL
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok"); // Handle network errors
        const rawData = await response.text(); // Convert response to text
        const data = d3.csvParse(rawData, d3.autoType); // Parse CSV data and automatically infer data types

        // Define countries to visualize
        const selectedCountries = ["United States", "China", "India", "Russia", "Japan", "Germany", "Canada", "Brazil", "United Kingdom", "Australia"];

        // Filter data for bar chart (2020 and 2010-2020 decade)
        const filteredDataForBarChart = data.filter(d => selectedCountries.includes(d.country) && (d.year === 2020 || (d.year >= 2010 && d.year <= 2020)));

        // Prepare bar chart data structure
        const barChartData = selectedCountries.map(country => {
            const countryData = filteredDataForBarChart.filter(d => d.country === country); // Filter data by country
            const year2020Data = countryData.find(d => d.year === 2020); // Get data for 2020
            const decadeData = countryData.filter(d => d.year >= 2010 && d.year <= 2020); // Get data for 2010-2020

            return {
                country: country,
                year2020: year2020Data ? year2020Data.co2_per_capita : 0, // CO2 per capita for 2020
                decadeAvg: d3.mean(decadeData, d => d.co2_per_capita) // Average CO2 per capita for the decade
            };
        });

        renderBarChartForCO2(barChartData); // Render bar chart

        // Filter data for heatmap (2020 only)
        const filteredDataForHeatmap = data.filter(d => selectedCountries.includes(d.country) && d.year === 2020);

        renderHeatmapForCO2(filteredDataForHeatmap); // Render heatmap
    } catch (error) {
        console.error("Error fetching or parsing data:", error); // Handle errors
    }
};

// Function to render the bar chart with D3.js
const renderBarChartForCO2 = (data) => {
    const barChartContainer = d3.select("#bar-chart");
    barChartContainer.selectAll("*").remove(); // Clear existing content

    // Define chart dimensions and margins
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    // Append SVG element for the chart
    const svgBar = barChartContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Flatten data for grouped bar chart - restructuring the data so that each entry can represent an individual bar in the grouped bar chart layout.
    const flatDataBar = [];
    data.forEach(d => {
        flatDataBar.push({ country: d.country, label: "2020", value: d.year2020 });
        flatDataBar.push({ country: d.country, label: "2010-2020 Avg", value: d.decadeAvg });
    });

    // Set up scales for bar chart
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

    // Define tooltip
    const tooltipBar = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("opacity", 0);

    // Draw bars and add tooltip functionality
    // Select all group ('g') elements inside the SVG container (none exist initially)
    svgBar.selectAll("g")
        // Bind data to the 'g' elements (one group per country)
        .data(data)
        // Enter the data binding (for each country)
        .enter()
        // Append a new 'g' element for each data point
        .append("g")
        // Position each group based on the X-axis scale for countries
        .attr("transform", d => `translate(${x0Bar(d.country)},0)`)
        // Select all rectangle ('rect') elements within each group (none exist initially)
        .selectAll("rect")
        // For each group, bind data for two bars: one for 2020 and one for the 2010-2020 average
        .data(d => [{ label: "2020", value: d.year2020 }, { label: "2010-2020 Avg", value: d.decadeAvg }])
        // Enter the data binding (for each bar)
        .enter()
        // Append a new 'rect' element for each bar
        .append("rect")
        // Set the X position of the bar based on the secondary X-axis scale
        .attr("x", d => x1Bar(d.label))
        // Set the Y position of the bar based on the Y-axis scale
        .attr("y", d => yBar(d.value))
        // Set the width of the bar to match the bandwidth of the secondary X-axis scale
        .attr("width", x1Bar.bandwidth())
        // Set the height of the bar based on the value (from the Y-axis scale)
        .attr("height", d => yBar(0) - yBar(d.value))
        // Set the color of the bar based on its label ("2020" or "2010-2020 Avg")
        .attr("fill", d => d.label === "2020" ? "#00b4db" : "#0083b0")
        // Add an event listener for mouseover to show a tooltip
        .on("mouseover", (event, d) => {
            // Show the tooltip with a smooth transition
            tooltipBar.transition().duration(200).style("opacity", 0.9);
            // Set the tooltip content and position near the mouse pointer
            tooltipBar.html(`Country: ${event.target.parentNode.__data__.country}<br>${d.label}: ${d.value.toFixed(2)} tons/capita`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
    // Add an event listener for mouseout to hide the tooltip
    .on("mouseout", () => {
        // Hide the tooltip with a smooth transition
        tooltipBar.transition().duration(500).style("opacity", 0);
    });


    // Add X-axis and rotate text labels
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

    // Define chart dimensions and margins
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    // Append SVG element for heatmap
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

    // Define tooltip
    const tooltipHeatmap = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("opacity", 0);

    // Draw heatmap cells and add tooltip functionality
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

    // Add X-axis and rotate text labels
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


// CO₂ Emissions by Sector for Top 5 Emitters 
// Section 1 - 3
// Stacked Bar Chart
// Function to fetch and parse CSV data for the stacked bar chart
// Function to fetch and prepare CO2 data for the emission categories chart
const fetchCO2DataForCategoriesChart = async () => {
    // URL for the CO2 data CSV file hosted on GitHub
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";

    try {
        // Fetch data from the URL
        const response = await fetch(url);

        // Check if the response is OK, throw an error if not
        if (!response.ok) throw new Error("Network response was not ok");

        // Read the response as text (CSV format)
        const rawData = await response.text();

        // Parse the CSV data using D3's CSV parser with automatic type conversion
        const data = d3.csvParse(rawData, d3.autoType);

        // Define the top emitting countries for the chart
        const topEmitters = ["United States", "China", "India", "Russia", "Japan"];
        const year = 2020;  // Year of interest

        // Filter the data for the selected countries and the specified year
        const filteredData = data.filter(d => topEmitters.includes(d.country) && d.year === year);

        // Prepare the data structure for the chart with category-wise emissions
        const chartData = filteredData.map(d => ({
            country: d.country,
            coal: d.coal_co2 || 0,  // CO2 emissions from coal, default to 0 if missing
            oil: d.oil_co2 || 0,    // CO2 emissions from oil
            gas: d.gas_co2 || 0,    // CO2 emissions from gas
            cement: d.cement_co2 || 0,  // CO2 emissions from cement production
            other: d.flaring_co2 || 0    // Use flaring emissions as a proxy for "other" emissions
        }));

        // Render the chart with the prepared data
        renderCategoriesChart(chartData);
    } catch (error) {
        // Log any errors that occur during data fetching or parsing
        console.error("Error fetching or parsing data:", error);
    }
};

// Function to render the categories chart using D3.js
const renderCategoriesChart = (data) => {
    // Select the chart container and remove any existing content
    const chartContainer = d3.select("#emission-categories-chart");
    chartContainer.selectAll("*").remove();

    // Set the chart dimensions and margins
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    // Append an SVG element to the chart container with the specified dimensions
    const svg = chartContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Define a color scale for each category
    const color = d3.scaleOrdinal()
        .domain(["coal", "oil", "gas", "cement", "other"])
        .range(["#4CAF50", "#FF5722", "#03A9F4", "#FFC107", "#9E9E9E"]);

    // Create a stack generator for stacking the data by categories
    const stack = d3.stack()
        .keys(["coal", "oil", "gas", "cement", "other"])
        .order(d3.stackOrderNone)  // Default order of stacking
        .offset(d3.stackOffsetNone);  // No offset for stacking

    // Generate the stacked data series
    const series = stack(data);

    // Define the X-axis scale for the countries
    const x = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    // Define the Y-axis scale based on the stacked data
    const y = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))]).nice()
        .range([height - margin.bottom, margin.top]);

    // Create groups for each series (stacked categories)
    svg.append("g")  
        // Select all potential group elements to bind data
        .selectAll("g")
        // Bind the stacked series data to these groups
        .data(series)
        // For each data point that doesn't have a corresponding element, create a new group
        .enter()
        .append("g")
        // Apply the appropriate color for each category in the stack
        .attr("fill", d => color(d.key))

        // For each group, select all potential rectangle elements to bind the stack segment data
        .selectAll("rect")
        // Bind each segment (category value) within the stacked series
        .data(d => d)
        // For each data point that doesn't have a corresponding element, create a new rectangle
        .enter()
        .append("rect")
        // Set the horizontal position of the rectangle based on the country's position on the X-axis
        .attr("x", d => x(d.data.country))
        // Set the top position of the rectangle based on the cumulative (stacked) value
        .attr("y", d => y(d[1]))
        // Calculate and set the height of the rectangle by finding the difference between the top and bottom stack values
        .attr("height", d => y(d[0]) - y(d[1]))
        // Set the width of the rectangle to fit the bandwidth allocated for each country on the X-axis
        .attr("width", x.bandwidth());


    // Add the X-axis with rotated text labels for readability
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add the Y-axis to the chart
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Add a legend to the chart
    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right - 120},${margin.top})`);

    // Create legend items for each category
    color.domain().forEach((key, i) => {
        // Add a colored rectangle for each category
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(key));

        // Add text label next to the rectangle
        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 12)
            .text(key.charAt(0).toUpperCase() + key.slice(1));  // Capitalize the category name
    });
};

// Fetch data and render the emission categories chart
fetchCO2DataForCategoriesChart();



// Fetch and parse data for the horizontal stacked bar chart
const fetchDataForHorizontalStackedBar = async () => {
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";  // URL for CO₂ data

    try {
        const response = await fetch(url);  // Fetch data from the URL
        if (!response.ok) throw new Error("Network response was not ok");  // Handle any network errors
        const rawData = await response.text();  // Convert response to text format
        const data = d3.csvParse(rawData, d3.autoType);  // Parse CSV data and infer data types

        // Define the list of countries to include in the chart
        const selectedCountries = ["United States", "China", "India", "Russia", "Japan", "Germany", "Canada", "Brazil", "United Kingdom", "Australia"];

        // Filter data for the selected countries and the year 2020
        const filteredData = data.filter(d => selectedCountries.includes(d.country) && d.year === 2020);

        // Prepare data by calculating emissions for each category and total emissions
        const chartData = filteredData.map(d => ({
            country: d.country,  // Country name
            coal: d.coal_co2 || 0,  // Emissions from coal
            oil: d.oil_co2 || 0,  // Emissions from oil
            gas: d.gas_co2 || 0,  // Emissions from gas
            cement: d.cement_co2 || 0,  // Emissions from cement
            other: d.other_co2 || 0,  // Emissions from other sources
            total: (d.coal_co2 || 0) + (d.oil_co2 || 0) + (d.gas_co2 || 0) + (d.cement_co2 || 0) + (d.other_co2 || 0)  // Total emissions
        }));

        // Sort the data by total emissions in descending order
        chartData.sort((a, b) => b.total - a.total);

        renderHorizontalStackedBarChart(chartData);  // Call the function to render the chart
    } catch (error) {
        console.error("Error fetching or parsing data:", error);  // Handle errors during fetch or parsing
    }
};

// Function to render the horizontal stacked bar chart with D3.js
const renderHorizontalStackedBarChart = (data) => {
    const chartContainer = d3.select("#horizontal-stacked-bar-chart");  // Select the chart container
    chartContainer.selectAll("*").remove();  // Clear any existing content in the container

    // Define chart dimensions and margins
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 150, bottom: 50, left: 100 };

    // Append an SVG element to the chart container and create a group element with margins
    const svg = chartContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define a color scale for each category
    const color = d3.scaleOrdinal()
        .domain(["coal", "oil", "gas", "cement", "other"])  // Define the categories
        .range(["#4CAF50", "#FF5722", "#03A9F4", "#FFC107", "#9E9E9E"]);  // Assign colors to each category

    // Set up a stack generator to prepare stacked data
    const stack = d3.stack()
        .keys(["coal", "oil", "gas", "cement", "other"]);  // Define the categories to stack

    const series = stack(data);  // Generate stacked data from the input data

    // Define the Y-axis scale based on the countries
    const y = d3.scaleBand()
        .domain(data.map(d => d.country))  // Map each country to a position
        .range([0, height])  // Define the height range
        .padding(0.1);  // Add padding between the bars

    // Define the X-axis scale based on the total emissions
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total)]).nice()  // Define the maximum range with padding
        .range([0, width]);  // Define the width range

   // Draw the stacked bars for each series
    svg.selectAll("g")  
        .data(series)  // Bind the stacked series data (each stack corresponds to one category)
        .enter()  // Enter selection to process new data points
        .append("g")  // Append a group element for each stack (category)
        .attr("fill", d => color(d.key))  // Apply a fill color to each group based on the category key

        .selectAll("rect")  
        .data(d => d)  // Bind individual data points within each stack (country-category combinations)
        .enter()  // Enter selection for each data point
        .append("rect")  // Append a rectangle for each data point

        // Positioning and sizing attributes for the rectangles
        .attr("y", d => y(d.data.country))  // Set the vertical position of the bar based on the country's position on the Y-axis
        .attr("x", d => x(d[0]))  // Set the starting horizontal position based on the cumulative value from the stack's previous categories
        .attr("width", d => x(d[1]) - x(d[0]))  // Set the bar width based on the difference between the start and end cumulative values
        .attr("height", y.bandwidth());  // Set the height of the bar to match the height of the Y-axis band for the country

    // Add the Y-axis to the chart
    svg.append("g")
        .call(d3.axisLeft(y));  // Attach a left-aligned Y-axis

    // Add the X-axis to the chart
    svg.append("g")
        .attr("transform", `translate(0,${height})`)  // Position the axis at the bottom of the chart
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d} t`));  // Attach a bottom-aligned X-axis with formatted ticks

    // Add a legend to the chart
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20},0)`);  // Position the legend to the right of the chart

    // Create legend entries for each category
    color.domain().forEach((key, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)  // Position each entry vertically with spacing
            .attr("width", 15)  // Set the width of the color box
            .attr("height", 15)  // Set the height of the color box
            .attr("fill", color(key));  // Fill the box with the corresponding color

        legend.append("text")
            .attr("x", 20)  // Position the text label next to the color box
            .attr("y", i * 20 + 12)  // Align the text vertically
            .text(key.charAt(0).toUpperCase() + key.slice(1));  // Capitalize and display the category name
    });
};

// Fetch data and render the horizontal stacked bar chart
fetchDataForHorizontalStackedBar();


// Fetch data and render the 100% stacked bar chart
const fetchAndRenderStackedBarChart100 = async () => {
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";  // URL for the CO₂ data

    try {
        const response = await fetch(url);  // Fetch the data from the URL
        if (!response.ok) throw new Error("Network response was not ok");  // Handle response errors
        const rawData = await response.text();  // Convert response to text format
        const data = d3.csvParse(rawData, d3.autoType);  // Parse CSV data with automatic type conversion

        // Define selected countries and categories for the chart
        const selectedCountries = ["United States", "China", "India", "Russia", "Japan", "Germany", "Canada", "Brazil", "United Kingdom", "Australia"];
        const categories = ["coal_co2", "oil_co2", "gas_co2", "cement_co2", "other_industry_co2"];

        // Filter data for the selected countries and year 2020
        const filteredData = data.filter(d => selectedCountries.includes(d.country) && d.year === 2020);

        // Prepare data structure for 100% stacked bar chart
        const chartData = filteredData.map(d => {
            const total = categories.reduce((sum, cat) => sum + (d[cat] || 0), 0);  // Calculate total CO₂ emissions for each country
            return {
                country: d.country,  // Country name
                categories: categories.map(cat => ({
                    category: cat,  // Category name
                    value: total > 0 ? (d[cat] || 0) / total : 0  // Calculate category percentage of total emissions
                }))
            };
        });

        renderStackedBarChart100(chartData);  // Call the function to render the chart
    } catch (error) {
        console.error("Error fetching or parsing data:", error);  // Log errors if any occur
    }
};

// Function to render the 100% stacked bar chart with D3.js
const renderStackedBarChart100 = (data) => {
    const chartContainer = d3.select("#stacked-bar-chart-100");  // Select the chart container element
    chartContainer.selectAll("*").remove();  // Clear any existing content in the container

    // Set chart dimensions and margins
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    // Append an SVG element to the chart container
    const svg = chartContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Define the X-axis scale for countries
    const x = d3.scaleBand()
        .domain(data.map(d => d.country))  // Map each country to a position on the X-axis
        .range([margin.left, width - margin.right])
        .padding(0.1);  // Add padding between country bars

    // Define the Y-axis scale for percentages
    const y = d3.scaleLinear()
        .domain([0, 1])  // Y-axis values range from 0 to 1 (100%)
        .range([height - margin.bottom, margin.top]);

    // Define a color scale for the categories
    const color = d3.scaleOrdinal()
        .domain(["coal_co2", "oil_co2", "gas_co2", "cement_co2", "other_industry_co2"])
        .range(["#FF5733", "#FFC300", "#DAF7A6", "#C70039", "#900C3F"]);

    // Generate stacked data structure
    const stack = d3.stack()
        .keys(["coal_co2", "oil_co2", "gas_co2", "cement_co2", "other_industry_co2"])
        .value((d, key) => d.categories.find(cat => cat.category === key)?.value || 0);

    const stackedData = stack(data);  // Apply stacking to the data

    // Draw stacked bars for each series (category)
    svg.selectAll("g")
        .data(stackedData)  // Bind the stacked data to groups
        .enter()
        .append("g")
        .attr("fill", d => color(d.key))  // Apply color based on the category key
        .selectAll("rect")
        .data(d => d)  // Bind each data point in the stack
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.country))  // Set the horizontal position based on the country
        .attr("y", d => y(d[1]))  // Set the top of the bar based on the stack end value
        .attr("height", d => y(d[0]) - y(d[1]))  // Set the height of the bar based on the difference between start and end values
        .attr("width", x.bandwidth());  // Set the width of the bar to fit within the country's band

    // Add X-axis to the chart
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")  // Rotate text labels for readability
        .style("text-anchor", "end");

    // Add Y-axis with percentage values
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(10, "%"));  // Display Y-axis with percentage ticks

    // Add legend to the chart
    const legend = svg.selectAll(".legend")
        .data(color.domain())  // Bind each category to a legend item
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);  // Position each legend item

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);  // Apply the corresponding color to the legend rectangle

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(d => d.replace("_co2", "").toUpperCase());  // Display category name in uppercase
};

// Fetch data and render the 100% stacked bar chart
fetchAndRenderStackedBarChart100();  // Trigger the data fetch and chart rendering


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
        // Create a new div for each country's waffle chart
        const countryGroup = chartContainer.append("div")
            .attr("class", "country-waffle")  // Assign a class name for styling purposes
            .style("display", "inline-block")  // Display each country's chart side by side
            .style("margin", "20px")  // Add margin around each country chart
            .style("width", `${squareSize * squaresPerRow + padding * (squaresPerRow - 1)}px`);  // Set the width based on the number of squares and padding
    
        // Add a label to display the country name
        countryGroup.append("div")
            .text(countryData.country)  // Set the text to the country's name
            .style("text-align", "center")  // Center-align the label
            .style("margin-bottom", "10px")  // Add spacing below the label
            .style("font-weight", "bold");  // Make the label text bold
    
        // Create an SVG element to hold the waffle chart for the country
        const svg = countryGroup.append("svg")
            .attr("width", squareSize * squaresPerRow + padding * (squaresPerRow - 1))  // Set SVG width based on square size and padding
            .attr("height", squareSize * squaresPerRow + padding * (squaresPerRow - 1));  // Set SVG height similarly
    
        // Draw rectangles for each square in the waffle chart
        svg.selectAll("rect")
            .data(countryData.squares)  // Bind data to the squares
            .enter()
            .append("rect")  // Add a rectangle for each data point
            .attr("width", squareSize)  // Set the width of each square
            .attr("height", squareSize)  // Set the height of each square
            .attr("x", (d, i) => (i % squaresPerRow) * (squareSize + padding))  // Calculate the horizontal position based on the square's index
            .attr("y", (d, i) => Math.floor(i / squaresPerRow) * (squareSize + padding))  // Calculate the vertical position based on the row
            .attr("fill", d => colorScale(d.category))  // Set the fill color based on the category using the color scale
            .append("title")  // Add a tooltip to each square
            .text(d => `Category: ${d.category.replace("_co2", "").toUpperCase()}`);  // Display the category name in the tooltip
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

    // Initialize counters to track how many nodes have been placed at each level
    const levelCounts = { continent: 0, country: 0, category: 0 };

    // Define the vertical spacing between nodes
    const verticalSpacing = height / 10;

    // Create an object to store the calculated positions of each node
    const nodePositions = {};

    // Loop through each node and calculate its position
    nodes.forEach((node) => {
        const level = levels[node.type];  // Get the level of the node (continent, country, or category)
        nodePositions[node.id] = {
            x: level * levelSpacing,  // Calculate horizontal position based on the level
            y: levelCounts[node.type] * verticalSpacing + nodePadding,  // Calculate vertical position based on node count
        };
        levelCounts[node.type] += 1;  // Increment the counter for this level
    });

    console.log("Node Positions:", nodePositions);  // Log the calculated node positions

    // Draw the links between nodes
    chart
        .selectAll(".link")
        .data(links)  // Bind the link data
        .enter()
        .append("path")  // Append a path element for each link - The path element in SVG is used to draw complex shapes and curves
        .attr("class", "link")  // Assign a class for styling
        .attr("d", (d) => {
            // Get the source and target positions for the link
            const source = nodePositions[d.source];
            const target = nodePositions[d.target];

            // Define the link path using a cubic Bézier curve
            return `M${source.x + 10},${source.y + nodeHeight / 2}C${(source.x +
                target.x) / 2},${source.y + nodeHeight / 2} ${(source.x + target.x) / 2},${target.y +
                nodeHeight / 2} ${target.x},${target.y + nodeHeight / 2}`;
        })
        .attr("fill", "none")  // No fill color for the path
        .attr("stroke", "#ccc")  // Set the stroke color to light gray
        .attr("stroke-width", (d) => Math.max(2, d.value / 1000))  // Set the stroke width based on the link's value
        .attr("opacity", 0.8);  // Set the opacity for the links

    console.log("Links Rendered:", links);  // Log the rendered links

    // Draw the nodes
    chart
        .selectAll(".node")
        .data(nodes)  // Bind the node data
        .enter()
        .append("rect")  // Append a rectangle element for each node
        .attr("class", "node")  // Assign a class for styling
        .attr("x", (d) => nodePositions[d.id].x)  // Set the horizontal position
        .attr("y", (d) => nodePositions[d.id].y)  // Set the vertical position
        .attr("width", 100)  // Set a fixed width for the node
        .attr("height", nodeHeight)  // Set a fixed height for the node
        .attr("fill", (d) => {
            // Set the fill color based on the node type
            if (d.type === "continent") return "#66c2a5";  // Greenish color for continents
            if (d.type === "country") return "#fc8d62";    // Orange color for countries
            return "#8da0cb";  // Blue color for categories
        });

    // Add labels to the nodes
    chart
        .selectAll(".label")
        .data(nodes)  // Bind the node data
        .enter()
        .append("text")  // Append a text element for each node
        .attr("x", (d) => nodePositions[d.id].x + 10)  // Position the label slightly inside the node horizontally
        .attr("y", (d) => nodePositions[d.id].y + nodeHeight / 2 + 5)  // Center the label vertically within the node
        .attr("fill", "#000")  // Set the text color to black
        .attr("font-size", 12)  // Set the font size
        .text((d) => d.id);  // Display the node's ID as the label text

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

        // Create nodes and links for the alluvial diagram
        Object.entries(countryToContinent).forEach(([country, continent]) => {

            // Add continent node if it hasn't been added already
            if (!nodeIds.has(continent)) {
                nodes.push({ id: continent, type: "continent" });
                nodeIds.add(continent);  // Mark the continent as added
            }

            // Add country node if it hasn't been added already
            if (!nodeIds.has(country)) {
                nodes.push({ id: country, type: "country" });
                nodeIds.add(country);  // Mark the country as added
            }

            // Find the CO₂ data for the country for the year 2020
            const countryData = data.find((d) => d.country === country && d.year === 2020);
            const totalCO2 = countryData ? countryData.co2 || 0 : 0;  // Use 0 if no data available

            // Create a link from the continent to the country, using total CO₂ emissions as the value
            links.push({ source: continent, target: country, value: totalCO2 });

            // Iterate over each emission category (coal, oil, gas, cement, land use change)
            ["coal_co2", "oil_co2", "gas_co2", "cement_co2", "land_use_change_co2"].forEach((category) => {

                // Add category node if it hasn't been added already
                if (!nodeIds.has(category)) {
                    nodes.push({ id: category, type: "category" });
                    nodeIds.add(category);  // Mark the category as added
                }

                // If the country has data for the current category, create a link from the country to the category
                if (countryData && countryData[category]) {
                    links.push({
                        source: country,         // Source node is the country
                        target: category,        // Target node is the emission category
                        value: countryData[category],  // Use the emission value for this category
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
// Map
const renderMap = async () => {
    console.log("Rendering map...");  // Log message to indicate map rendering process has started

    // URLs for CO2 emissions data and world map GeoJSON data
    const url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";
    const worldGeoJSON = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

    try {
        // Fetch the CO2 emissions CSV data
        const response = await fetch(url);
        const rawData = await response.text();
        const data = d3.csvParse(rawData, d3.autoType);  // Parse the CSV data with automatic type conversion

        console.log("Data fetched successfully.");  // Log message indicating data fetch was successful

        // Fetch the GeoJSON data for the world map
        const geoResponse = await fetch(worldGeoJSON);
        const geoData = await geoResponse.json();  // Parse the GeoJSON data

        console.log("GeoJSON fetched successfully.");  // Log message indicating GeoJSON fetch was successful

        // Filter CO2 data for the selected year (2020)
        const selectedYear = 2020;
        const filteredData = data.filter(d => d.year === selectedYear);

        // Map the filtered CO2 data to the GeoJSON features
        geoData.features.forEach(feature => {
            const countryData = filteredData.find(d => d.iso_code === feature.id);  // Match data by country code
            // Add emission properties to each feature; fallback to 0 if data is missing
            feature.properties.emissions = countryData ? countryData.co2 || 0 : 0;
            feature.properties.coal_co2 = countryData ? countryData.coal_co2 || 0 : 0;
            feature.properties.oil_co2 = countryData ? countryData.oil_co2 || 0 : 0;
            feature.properties.gas_co2 = countryData ? countryData.gas_co2 || 0 : 0;
            feature.properties.cement_co2 = countryData ? countryData.cement_co2 || 0 : 0;
            feature.properties.land_use_change_co2 = countryData ? countryData.land_use_change_co2 || 0 : 0;
        });

        console.log("GeoJSON mapped data:", geoData.features);  // Log the mapped GeoJSON data

        // Set up map dimensions
        const width = 800;
        const height = 600;

        // Append an SVG element to the map container
        const svg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Define a Mercator projection for the map - A Mercator projection is a way to flatten the globe into a 2D map
        const projection = d3.geoMercator()
            .scale(130)  // Set the scale of the projection
            .translate([width / 2, height / 1.5]);  // Center the map within the SVG

        const path = d3.geoPath().projection(projection);  // Create a path generator using the projection

        // Initialize a color scale for emissions
        const maxEmission = d3.max(geoData.features, d => d.properties.emissions);  // Find the maximum emissions value
        console.log("Max emission value:", maxEmission);  // Log the maximum emission value

        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, maxEmission]);  // Set the color scale domain from 0 to the maximum emission value

        // Draw the map by appending path elements for each country
        svg.selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("d", path)  // Generate the path data for each feature
            .attr("fill", d => {
                const value = d.properties.emissions;
                return value > 0 ? colorScale(value) : "#ccc";  // Use color scale if data exists, otherwise use a default color
            })
            .attr("stroke", "#000")  // Outline color for countries
            .attr("stroke-width", 0.5)  // Set the stroke width
            .on("mouseover", (event, d) => {
                // Show the tooltip with country and emissions details on mouseover
                d3.select("#tooltip")
                    .style("opacity", 1)
                    .html(`
                        <strong>${d.properties.name}</strong><br>
                        Total Emissions: ${d.properties.emissions || 0} Mt<br>
                        Coal: ${d.properties.coal_co2 || 0} Mt<br>
                        Oil: ${d.properties.oil_co2 || 0} Mt<br>
                        Gas: ${d.properties.gas_co2 || 0} Mt<br>
                        Cement: ${d.properties.cement_co2 || 0} Mt<br>
                        Land Use Change: ${d.properties.land_use_change_co2 || 0} Mt
                    `)
                    .style("left", `${event.pageX + 10}px`)  // Position the tooltip near the cursor
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                // Hide the tooltip on mouseout
                d3.select("#tooltip").style("opacity", 0);
            });

        // Add a tooltip element to the body
        d3.select("body").append("div")
            .attr("id", "tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("padding", "10px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "5px")
            .style("opacity", 0);  // Hide the tooltip by default

        // Add dropdown functionality to update the map based on selected emission category
        d3.select("#emission-category").on("change", function () {
            const selectedCategory = this.value;  // Get the selected category
            const maxValue = d3.max(geoData.features, d => d.properties[selectedCategory]);  // Find the maximum value for the category
            console.log(`Max value for ${selectedCategory}:`, maxValue);  // Log the maximum value
            colorScale.domain([0, maxValue]);  // Update the color scale domain

            // Update the map colors with a transition
            svg.selectAll("path")
                .transition()
                .duration(500)  // Set the duration for the transition
                .attr("fill", d => {
                    const value = d.properties[selectedCategory];
                    return value > 0 ? colorScale(value) : "#ccc";  // Update the fill color based on the new category
                });
        });

    } catch (error) {
        console.error("Error fetching or rendering map:", error);  // Log any errors that occur
    }
};

// Call the function to render the map
renderMap();