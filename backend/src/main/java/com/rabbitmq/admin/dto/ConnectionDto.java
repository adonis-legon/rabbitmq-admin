package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * DTO for RabbitMQ connection information.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConnectionDto {

    @JsonProperty("name")
    private String name;

    @JsonProperty("state")
    private String state;

    @JsonProperty("channels")
    private Integer channels;

    @JsonProperty("client_properties")
    private Map<String, Object> clientProperties;

    @JsonProperty("host")
    private String host;

    @JsonProperty("peer_host")
    private String peerHost;

    @JsonProperty("port")
    private Integer port;

    @JsonProperty("peer_port")
    private Integer peerPort;

    @JsonProperty("protocol")
    private String protocol;

    @JsonProperty("user")
    private String user;

    @JsonProperty("vhost")
    private String vhost;

    @JsonProperty("timeout")
    private Integer timeout;

    @JsonProperty("frame_max")
    private Integer frameMax;

    @JsonProperty("connected_at")
    private Long connectedAt;

    // Statistics fields
    @JsonProperty("recv_oct")
    private Long recvOct;

    @JsonProperty("recv_cnt")
    private Long recvCnt;

    @JsonProperty("send_oct")
    private Long sendOct;

    @JsonProperty("send_cnt")
    private Long sendCnt;

    public ConnectionDto() {
    }

    public ConnectionDto(String name, String state, Integer channels, Map<String, Object> clientProperties,
            String host, String peerHost, Integer port, Integer peerPort, String protocol,
            String user, String vhost, Long connectedAt) {
        this.name = name;
        this.state = state;
        this.channels = channels;
        this.clientProperties = clientProperties;
        this.host = host;
        this.peerHost = peerHost;
        this.port = port;
        this.peerPort = peerPort;
        this.protocol = protocol;
        this.user = user;
        this.vhost = vhost;
        this.connectedAt = connectedAt;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Integer getChannels() {
        return channels;
    }

    public void setChannels(Integer channels) {
        this.channels = channels;
    }

    public Map<String, Object> getClientProperties() {
        return clientProperties;
    }

    public void setClientProperties(Map<String, Object> clientProperties) {
        this.clientProperties = clientProperties;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public String getPeerHost() {
        return peerHost;
    }

    public void setPeerHost(String peerHost) {
        this.peerHost = peerHost;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public Integer getPeerPort() {
        return peerPort;
    }

    public void setPeerPort(Integer peerPort) {
        this.peerPort = peerPort;
    }

    public String getProtocol() {
        return protocol;
    }

    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getVhost() {
        return vhost;
    }

    public void setVhost(String vhost) {
        this.vhost = vhost;
    }

    public Integer getTimeout() {
        return timeout;
    }

    public void setTimeout(Integer timeout) {
        this.timeout = timeout;
    }

    public Integer getFrameMax() {
        return frameMax;
    }

    public void setFrameMax(Integer frameMax) {
        this.frameMax = frameMax;
    }

    public Long getConnectedAt() {
        return connectedAt;
    }

    public void setConnectedAt(Long connectedAt) {
        this.connectedAt = connectedAt;
    }

    public Long getRecvOct() {
        return recvOct;
    }

    public void setRecvOct(Long recvOct) {
        this.recvOct = recvOct;
    }

    public Long getRecvCnt() {
        return recvCnt;
    }

    public void setRecvCnt(Long recvCnt) {
        this.recvCnt = recvCnt;
    }

    public Long getSendOct() {
        return sendOct;
    }

    public void setSendOct(Long sendOct) {
        this.sendOct = sendOct;
    }

    public Long getSendCnt() {
        return sendCnt;
    }

    public void setSendCnt(Long sendCnt) {
        this.sendCnt = sendCnt;
    }
}