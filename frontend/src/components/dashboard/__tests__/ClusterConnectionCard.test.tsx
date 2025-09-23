import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ClusterConnectionCard from "../ClusterConnectionCard";
import { ClusterConnection } from "../../../types/cluster";

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

const mockCluster: ClusterConnection = {
  id: "1",
  name: "Test Cluster",
  apiUrl: "http://localhost:15672",
  username: "admin",
  password: "password",
  description: "Test cluster description",
  active: true,
  assignedUsers: [],
};

const mockInactiveCluster: ClusterConnection = {
  ...mockCluster,
  id: "2",
  name: "Inactive Cluster",
  active: false,
};

describe("ClusterConnectionCard", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders cluster information correctly", () => {
    renderWithProviders(
      <ClusterConnectionCard
        cluster={mockCluster}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("Test Cluster")).toBeInTheDocument();
    expect(screen.getByText("http://localhost:15672")).toBeInTheDocument();
    expect(screen.getByText("Test cluster description")).toBeInTheDocument();
    expect(screen.getByText("User: admin")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows inactive status for inactive clusters", () => {
    renderWithProviders(
      <ClusterConnectionCard
        cluster={mockInactiveCluster}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("shows selected state when cluster is selected", () => {
    renderWithProviders(
      <ClusterConnectionCard
        cluster={mockCluster}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    expect(
      screen.getByRole("button", { name: "Selected" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Selected")).toHaveLength(2); // Button and chip
  });

  it("shows select button when cluster is not selected", () => {
    renderWithProviders(
      <ClusterConnectionCard
        cluster={mockCluster}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument();
  });

  it("calls onSelect when select button is clicked", () => {
    renderWithProviders(
      <ClusterConnectionCard
        cluster={mockCluster}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it("disables RabbitMQ launch button for inactive clusters", () => {
    renderWithProviders(
      <ClusterConnectionCard
        cluster={mockInactiveCluster}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    const launchButton = screen.getByLabelText("Open RabbitMQ Management");
    expect(launchButton).toBeDisabled();
  });

  it("enables RabbitMQ launch button for active clusters", () => {
    renderWithProviders(
      <ClusterConnectionCard
        cluster={mockCluster}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    const launchButton = screen.getByLabelText("Open RabbitMQ Management");
    expect(launchButton).not.toBeDisabled();
  });
});
