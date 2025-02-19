# Interactive Data Visualization of Gait Differences in Neurodegenerative Diseases

## Overview

This project is an interactive data visualization that showcases differences in gait among individuals with neurodegenerative diseases. The goal was to present gait differences dynamically, allowing medical professionals and patients to interact with and analyze the data effectively. By visualizing stride intervals and elapsed time, this project provides valuable insights into how gait changes due to conditions such as ALS, Parkinson’s, and Huntington’s disease.

## Importance of Understanding Gait Differences

Understanding gait differences is clinically significant because it can:

- Aid in early diagnosis

- Track disease progression

- Evaluate treatment efficacy

Medical professionals can use this tool to compare stride intervals among different conditions, helping them identify gait-related diseases more easily.

## Features

- Interactive Line Chart: Displays trends in stride intervals over time.

- Color-coded Groups: Each group is assigned a distinct color to differentiate them easily.

- Green is used for the control (healthy) group to intuitively indicate health.

- Legend with Clickable Filters: Users can select which groups to display for better comparisons.

- Zoom Functionality: Allows users to focus on specific time intervals for clearer analysis.

Tooltips: Displays precise stride interval values when hovering over data points.

- Timeline Slider: Enables manual control of time progression.

- Play/Pause Animation: Animates the graph to show changes over time dynamically.

## Design and Development Decisions

Initially, we considered using a stick figure animation to represent gait differences visually. However, we shifted to an interactive line chart because:

- Stick figures did not effectively convey key metrics.

- It was challenging to make them interactive and filterable.

- A line chart better suited time series data and allowed users to analyze stride intervals effectively.

To improve clarity:

- We used a non-clashing color palette for multiple groups.

- We ensured the zooming feature adjusted both axis scaling and line positions dynamically.

- We refined the timeline slider to provide better control than just a play/pause button.

## Technologies Used

- JavaScript (D3.js for interactive visualizations)

- HTML/CSS for layout and styling

## Conclusion 

This interactive visualization helps bring clarity to gait differences in neurodegenerative diseases. By allowing users to dynamically interact with the data, it provides a valuable tool for medical professionals and patients alike. The combination of interactive elements, clear visualizations, and detailed filtering options enhances the ability to study gait patterns effectively. 
