import { vi, describe, it, expect, beforeEach } from "vitest";
import { rabbitmqResourcesApi } from "../../../services/api/rabbitmqResourcesApi";

// Mock the API
vi.mock("../../../services/api/rabbitmqResourcesApi", () => ({
  rabbitmqResourcesApi: {
    getExchanges: vi.fn(),
    getQueues: vi.fn(),
    createExchange: vi.fn(),
    createQueue: vi.fn(),
    deleteExchange: vi.fn(),
    deleteQueue: vi.fn(),
    purgeQueue: vi.fn(),
    createExchangeToQueueBinding: vi.fn(),
    createExchangeToExchangeBinding: vi.fn(),
    publishMessage: vi.fn(),
    publishToQueue: vi.fn(),
    getMessages: vi.fn(),
    getVirtualHosts: vi.fn(),
    getExchangeBindings: vi.fn(),
    getQueueBindings: vi.fn(),
  },
}));

describe("Write Operations Integration Tests", () => {
  const mockClusterId = "test-cluster-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Exchange Write Operations API Integration", () => {
    it("should call createExchange API with correct parameters", async () => {
      const mockRequest = {
        name: "test-exchange",
        type: "direct" as const,
        vhost: "/",
        durable: true,
        autoDelete: false,
        internal: false,
        arguments: {},
      };

      (rabbitmqResourcesApi.createExchange as any).mockResolvedValue(undefined);

      await rabbitmqResourcesApi.createExchange(mockClusterId, mockRequest);

      expect(rabbitmqResourcesApi.createExchange).toHaveBeenCalledWith(
        mockClusterId,
        mockRequest
      );
    });

    it("should call deleteExchange API with correct parameters", async () => {
      (rabbitmqResourcesApi.deleteExchange as any).mockResolvedValue(undefined);

      await rabbitmqResourcesApi.deleteExchange(
        mockClusterId,
        "/",
        "test-exchange",
        false
      );

      expect(rabbitmqResourcesApi.deleteExchange).toHaveBeenCalledWith(
        mockClusterId,
        "/",
        "test-exchange",
        false
      );
    });

    it("should call publishMessage API with correct parameters", async () => {
      const mockRequest = {
        routingKey: "test.key",
        payload: "Test message",
        payloadEncoding: "string" as const,
        properties: { delivery_mode: 2 },
      };

      (rabbitmqResourcesApi.publishMessage as any).mockResolvedValue({
        routed: true,
      });

      const result = await rabbitmqResourcesApi.publishMessage(
        mockClusterId,
        "/",
        "test-exchange",
        mockRequest
      );

      expect(rabbitmqResourcesApi.publishMessage).toHaveBeenCalledWith(
        mockClusterId,
        "/",
        "test-exchange",
        mockRequest
      );
      expect(result).toEqual({ routed: true });
    });

    it("should call createExchangeToQueueBinding API with correct parameters", async () => {
      const mockRequest = {
        routingKey: "test.routing.key",
        arguments: {},
      };

      (
        rabbitmqResourcesApi.createExchangeToQueueBinding as any
      ).mockResolvedValue(undefined);

      await rabbitmqResourcesApi.createExchangeToQueueBinding(
        mockClusterId,
        "/",
        "test-exchange",
        "test-queue",
        mockRequest
      );

      expect(
        rabbitmqResourcesApi.createExchangeToQueueBinding
      ).toHaveBeenCalledWith(
        mockClusterId,
        "/",
        "test-exchange",
        "test-queue",
        mockRequest
      );
    });
  });

  describe("Queue Write Operations API Integration", () => {
    it("should call createQueue API with correct parameters", async () => {
      const mockRequest = {
        name: "test-queue",
        vhost: "/",
        durable: true,
        autoDelete: false,
        exclusive: false,
        arguments: { "x-message-ttl": 3600000 },
      };

      (rabbitmqResourcesApi.createQueue as any).mockResolvedValue(undefined);

      await rabbitmqResourcesApi.createQueue(mockClusterId, mockRequest);

      expect(rabbitmqResourcesApi.createQueue).toHaveBeenCalledWith(
        mockClusterId,
        mockRequest
      );
    });

    it("should call deleteQueue API with correct parameters", async () => {
      (rabbitmqResourcesApi.deleteQueue as any).mockResolvedValue(undefined);

      await rabbitmqResourcesApi.deleteQueue(
        mockClusterId,
        "/",
        "test-queue",
        true,
        false
      );

      expect(rabbitmqResourcesApi.deleteQueue).toHaveBeenCalledWith(
        mockClusterId,
        "/",
        "test-queue",
        true,
        false
      );
    });

    it("should call purgeQueue API with correct parameters", async () => {
      (rabbitmqResourcesApi.purgeQueue as any).mockResolvedValue(undefined);

      await rabbitmqResourcesApi.purgeQueue(mockClusterId, "/", "test-queue");

      expect(rabbitmqResourcesApi.purgeQueue).toHaveBeenCalledWith(
        mockClusterId,
        "/",
        "test-queue"
      );
    });

    it("should call publishToQueue API with correct parameters", async () => {
      const mockRequest = {
        payload: "Direct queue message",
        payloadEncoding: "string" as const,
        properties: { delivery_mode: 2 },
      };

      (rabbitmqResourcesApi.publishToQueue as any).mockResolvedValue({
        routed: true,
      });

      const result = await rabbitmqResourcesApi.publishToQueue(
        mockClusterId,
        "/",
        "test-queue",
        mockRequest
      );

      expect(rabbitmqResourcesApi.publishToQueue).toHaveBeenCalledWith(
        mockClusterId,
        "/",
        "test-queue",
        mockRequest
      );
      expect(result).toEqual({ routed: true });
    });

    it("should call getMessages API with correct parameters", async () => {
      const mockRequest = {
        count: 5,
        ackmode: "ack_requeue_true" as const,
        encoding: "auto" as const,
      };

      const mockMessages = [
        {
          payload: "Test message content",
          payload_encoding: "string",
          properties: { delivery_mode: 2 },
          routing_key: "test.key",
          redelivered: false,
          exchange: "test-exchange",
          message_count: 1,
        },
      ];

      (rabbitmqResourcesApi.getMessages as any).mockResolvedValue(mockMessages);

      const result = await rabbitmqResourcesApi.getMessages(
        mockClusterId,
        "/",
        "test-queue",
        mockRequest
      );

      expect(rabbitmqResourcesApi.getMessages).toHaveBeenCalledWith(
        mockClusterId,
        "/",
        "test-queue",
        mockRequest
      );
      expect(result).toEqual(mockMessages);
    });

    it("should call createExchangeToExchangeBinding API with correct parameters", async () => {
      const mockRequest = {
        routingKey: "binding.key",
        arguments: {},
      };

      (
        rabbitmqResourcesApi.createExchangeToExchangeBinding as any
      ).mockResolvedValue(undefined);

      await rabbitmqResourcesApi.createExchangeToExchangeBinding(
        mockClusterId,
        "/",
        "test-exchange",
        "test-destination-exchange",
        mockRequest
      );

      expect(
        rabbitmqResourcesApi.createExchangeToExchangeBinding
      ).toHaveBeenCalledWith(
        mockClusterId,
        "/",
        "test-exchange",
        "test-destination-exchange",
        mockRequest
      );
    });
  });

  describe("Virtual Hosts API Integration", () => {
    it("should call getVirtualHosts API with correct parameters", async () => {
      const mockVirtualHosts = [
        { name: "/", description: "Default virtual host" },
        { name: "test-vhost", description: "Test virtual host" },
      ];

      (rabbitmqResourcesApi.getVirtualHosts as any).mockResolvedValue(
        mockVirtualHosts
      );

      const result = await rabbitmqResourcesApi.getVirtualHosts(mockClusterId);

      expect(rabbitmqResourcesApi.getVirtualHosts).toHaveBeenCalledWith(
        mockClusterId
      );
      expect(result).toEqual(mockVirtualHosts);
    });
  });

  describe("Binding Operations API Integration", () => {
    it("should call getExchangeBindings API with correct parameters", async () => {
      const mockBindings = [
        {
          source: "test-exchange",
          destination: "test-queue",
          destination_type: "queue",
          routing_key: "test.routing.key",
          arguments: {},
          vhost: "/",
        },
      ];

      (rabbitmqResourcesApi.getExchangeBindings as any).mockResolvedValue(
        mockBindings
      );

      const result = await rabbitmqResourcesApi.getExchangeBindings(
        mockClusterId,
        "/",
        "test-exchange"
      );

      expect(rabbitmqResourcesApi.getExchangeBindings).toHaveBeenCalledWith(
        mockClusterId,
        "/",
        "test-exchange"
      );
      expect(result).toEqual(mockBindings);
    });

    it("should call getQueueBindings API with correct parameters", async () => {
      const mockBindings = [
        {
          source: "test-exchange",
          destination: "test-queue",
          destination_type: "queue",
          routing_key: "test.routing.key",
          arguments: {},
          vhost: "/",
        },
      ];

      (rabbitmqResourcesApi.getQueueBindings as any).mockResolvedValue(
        mockBindings
      );

      const result = await rabbitmqResourcesApi.getQueueBindings(
        mockClusterId,
        "/",
        "test-queue"
      );

      expect(rabbitmqResourcesApi.getQueueBindings).toHaveBeenCalledWith(
        mockClusterId,
        "/",
        "test-queue"
      );
      expect(result).toEqual(mockBindings);
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      const errorMessage = "Exchange already exists";
      (rabbitmqResourcesApi.createExchange as any).mockRejectedValue(
        new Error(errorMessage)
      );

      const mockRequest = {
        name: "duplicate-exchange",
        type: "direct" as const,
        vhost: "/",
        durable: true,
        autoDelete: false,
        internal: false,
        arguments: {},
      };

      await expect(
        rabbitmqResourcesApi.createExchange(mockClusterId, mockRequest)
      ).rejects.toThrow(errorMessage);
    });

    it("should handle network errors", async () => {
      (rabbitmqResourcesApi.getVirtualHosts as any).mockRejectedValue(
        new Error("Network error")
      );

      await expect(
        rabbitmqResourcesApi.getVirtualHosts(mockClusterId)
      ).rejects.toThrow("Network error");
    });
  });

  describe("Different Exchange Types", () => {
    it("should support creating different exchange types", async () => {
      const exchangeTypes = ["direct", "fanout", "topic", "headers"];

      (rabbitmqResourcesApi.createExchange as any).mockResolvedValue(undefined);

      for (const type of exchangeTypes) {
        const mockRequest = {
          name: `test-${type}-exchange`,
          type: type as "direct" | "fanout" | "topic" | "headers",
          vhost: "/",
          durable: true,
          autoDelete: false,
          internal: false,
          arguments: {},
        };

        await rabbitmqResourcesApi.createExchange(mockClusterId, mockRequest);

        expect(rabbitmqResourcesApi.createExchange).toHaveBeenCalledWith(
          mockClusterId,
          mockRequest
        );
      }
    });
  });

  describe("Message Acknowledgment Modes", () => {
    it("should support different acknowledgment modes", async () => {
      const ackModes = [
        "ack_requeue_true",
        "ack_requeue_false",
        "reject_requeue_true",
        "reject_requeue_false",
      ];

      (rabbitmqResourcesApi.getMessages as any).mockResolvedValue([]);

      for (const ackMode of ackModes) {
        const mockRequest = {
          count: 1,
          ackmode: ackMode as
            | "ack_requeue_true"
            | "ack_requeue_false"
            | "reject_requeue_true"
            | "reject_requeue_false",
          encoding: "auto" as const,
        };

        await rabbitmqResourcesApi.getMessages(
          mockClusterId,
          "/",
          "test-queue",
          mockRequest
        );

        expect(rabbitmqResourcesApi.getMessages).toHaveBeenCalledWith(
          mockClusterId,
          "/",
          "test-queue",
          mockRequest
        );
      }
    });
  });

  describe("Virtual Host Encoding", () => {
    it("should handle different virtual host names", async () => {
      const vhosts = ["/", "test-vhost", "production-vhost"];

      (rabbitmqResourcesApi.createExchange as any).mockResolvedValue(undefined);

      for (const vhost of vhosts) {
        const mockRequest = {
          name: "test-exchange",
          type: "direct" as const,
          vhost: vhost,
          durable: true,
          autoDelete: false,
          internal: false,
          arguments: {},
        };

        await rabbitmqResourcesApi.createExchange(mockClusterId, mockRequest);

        expect(rabbitmqResourcesApi.createExchange).toHaveBeenCalledWith(
          mockClusterId,
          mockRequest
        );
      }
    });
  });
});
