import { ClusterAddOn, ClusterInfo } from "@aws-quickstart/ssp-amazon-eks";
import { Construct } from "@aws-cdk/core";

export interface NewRelicAddOnProps {
    /**
     * Namespace for the add-on.
     */
    namespace?: string;

    /**
     * New Relic License Key
     */
    newRelicLicenseKey?: string;

    /**
     * Kubernetes cluster name in New Relic
     */
    newRelicClusterName?: string;

    /**
     * Helm chart version
     */
    version?: string;

    /**
     * Helm chart repository.
     * Defaults to the official repo URL.
     */
    repository?: string;

    /**
     * Release name.
     * Defaults to 'newrelic-bundle'.
     */
    release?: string;

    /**
     * Chart name.
     * Defaults to 'nri-bundle'.
     */
    chart?: string;

    /**
     * Set to true to enable Low Data Mode (default: true)
     * See docs for more details: https://docs.newrelic.com/docs/kubernetes-pixie/kubernetes-integration/installation/install-kubernetes-integration-using-helm/#reducedataingest
     */
    lowDataMode?: boolean;

    /**
     * Set to true to install the New Relic Infrastructure Daemonset (default: true)
     */
    installInfrastructure?: boolean;

    /**
     * Set to false to disable privileged install of New Relic Infrastructure Daemonset (default: true)
     */
    installInfrastructurePrivileged?: boolean;

    /**
     * Set to true to install the Kube State Metrics (default: true)
     */
    installKSM?: boolean;

    /**
     * Set to true to install New Relic Prometheus OpenMetrics Integration (default: true)
     */
    installPrometheus?: boolean;

    /**
     * Set to true to install the New Relic Fluent-Bit Logging integration (default: true)
     */
    installLogging?: boolean;

    /**
     * Values to pass to the chart.
     * Config options: https://github.com/newrelic/helm-charts/tree/master/charts/nri-bundle#configuration
     */
    values?: {
        [key: string]: any;
    };
}

const defaultProps: NewRelicAddOnProps = {
    repository: "https://helm-charts.newrelic.com",
    chart: "nri-bundle",
    namespace: "newrelic",
    version: "3.2.11",
    release: "newrelic-bundle",
    lowDataMode: true,
    installInfrastructure: true,
    installInfrastructurePrivileged: true,
    installKSM: true,
    installPrometheus: true,
    installLogging: true
};

/**
 * Utility for setting individual values by name
 * https://github.com/aws-quickstart/ssp-amazon-eks/blob/main/lib/utils/object-utils.ts
 */
const setPath = (obj : any, path: string, val: any) => {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    const lastObj = keys.reduce((obj, key) =>
        obj[key] = obj[key] || {},
        obj);
    lastObj[lastKey] = val;
};

export class NewRelicAddOn implements ClusterAddOn {

    readonly options: NewRelicAddOnProps;

    constructor(props?: NewRelicAddOnProps) {
        this.options = { ...defaultProps, ...props };
    }

    deploy(clusterInfo: ClusterInfo): Promise<Construct> {

        const props = this.options;

        const values = { ...props.values ?? {}};

        if (props.newRelicClusterName) {
            setPath(values, "global.cluster", props.newRelicClusterName)
        }

        if (props.newRelicLicenseKey) {
            setPath(values, "global.licenseKey", props.newRelicLicenseKey);
        }

        if (props.lowDataMode) {
            setPath(values, "global.lowDataMode", props.lowDataMode)
        }

        if (props.installPrometheus) {
            setPath(values, "prometheus", props.installPrometheus)
        }

        if (props.installLogging) {
            setPath(values, "logging", props.installLogging)
        }

        if (props.installInfrastructure) {
            setPath(values, "infrastructure.enabled", props.installInfrastructure);
            setPath(values, "newrelic-infrastructure.privileged", props.installInfrastructurePrivileged);
        }

        if (props.installKSM) {
            setPath(values, "ksm.enabled", props.installKSM);
        }

        const newRelicHelmChart = clusterInfo.cluster.addHelmChart("newrelic-bundle", {
            chart: props.chart ? props.chart : "nri-bundle",
            release: props.release,
            repository: props.repository,
            namespace: props.namespace,
            version: props.version,
            values
        });
        return Promise.resolve(newRelicHelmChart);
    }
}