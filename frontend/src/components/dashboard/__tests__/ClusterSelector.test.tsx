import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ClusterSelector from "../ClusterSelector";
import { ClusterConnection } from "../../../types/cluster";

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

const mockClusters: ClusterConnection[] = [
  {
    id: "1",
    name: "Test Cluster 1",
    apiUrl: "http://localhost:15672",
    username: "admin",
    password: "password",
    description: "Test cluster 1",
    active: true,
    assignedUsers: [],
  },
  {
    id: "2",
    name: "Test Cluster 2",
    apiUrl: "http://localhost:15673",
    username: "admin",
    password: "password",
    description: "Test cluster 2",
    active: false,
    assignedUsers: [],
  },
];

describe("ClusterSelector", () => {
  const mockOnClusterSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when no clusters are provided", () => {
    const { container } = renderWithProviders(
      <ClusterSelector
        clusters={[]}
        selectedCluster={null}
        onClusterSelect={mockOnClusterSelect}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders cluster selector with clusters", () => {
    renderWithProviders(
      <ClusterSelector
        clusters={mockClusters}
        selectedCluster={null}
        onClusterSelect={mockOnClusterSelect}
      />
    );

    expect(screen.getByText("Active Cluster Selection")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Active Cluster")).toBeInTheDocument();
  });

  it("shows selected cluster information", () => {
    renderWithProviders(
      <ClusterSelector
        clusters={mockClusters}
        selectedCluster={mockClusters[0]}
        onClusterSelect={mockOnClusterSelect}
      />
    );

    expect(screen.getByText("Currently Selected:")).toBeInTheDocument();
    expect(screen.getAllByText("Test Cluster 1")).toHaveLength(2); // One in dropdown, one in selected info
    expect(screen.getByText("Test cluster 1")).toBeInTheDocument();
  });

  it("calls onClusterSelect when a cluster is selected", () => {
    renderWithProviders(
      <ClusterSelector
        clusters={mockClusters}
        selectedCluster={null}
        onClusterSelect={mockOnClusterSelect}
      />
    );

    // Open the select dropdown
    const selectElement = screen.getByLabelText("Select Active Cluster");
    fireEvent.mouseDown(selectElement);

    // Click on the first cluster option
    const option = screen.getByText("Test Cluster 1");
    fireEvent.click(option);

    expect(mockOnClusterSelect).toHaveBeenCalledWith(mockClusters[0]);
  });

  it("displays cluster status in dropdown options", () => {
    renderWithProviders(
      <ClusterSelector
        clusters={mockClusters}
        selectedCluster={null}
        onClusterSelect={mockOnClusterSelect}
      />
    );

    // Open the select dropdown
    const selectElement = screen.getByLabelText("Select Active Cluster");
    fireEvent.mouseDown(selectElement);

    // Check that status chips are displayed
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });
});
