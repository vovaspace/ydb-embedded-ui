import React, {useEffect, useRef, useState} from 'react';
import cn from 'bem-cn-lite';
import MonacoEditor from 'react-monaco-editor';
import {Loader, RadioButton} from '@gravity-ui/uikit';
import JSONTree from 'react-json-inspector';
import {LANGUAGE_S_EXPRESSION_ID} from '../../../../utils/monaco';
import {
    TextOverflow,
    getYdbPlanNodeShape,
    getCompactTopology,
    getTopology,
} from '@yandex-cloud/paranoid';
import {renderExplainNode} from '../../../../utils';
import {explainVersions} from '../../../../store/reducers/explainQuery';
import QueryExecutionStatus from '../../../../components/QueryExecutionStatus/QueryExecutionStatus';
import Divider from '../../../../components/Divider/Divider';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';

import 'react-json-inspector/json-inspector.css';
import './QueryExplain.scss';
import {useDispatch, useSelector} from 'react-redux';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';

const b = cn('kv-query-explain');

const DARK_COLORS = {
    success: 'rgba(59,201,53,0.75)',
    error: '#bf3230',
    warning: '#cc6810',
    mute: 'rgba(255,255,255,0.15)',
    stroke: 'rgba(255,255,255,0.17)',
    fill: '#313037',
    nodeFill: '#3b3a41',
    nodeShadow: 'rgba(0,0,0,0.2)',
    titleColor: 'rgba(255,255,255,0.7)',
    textColor: 'rgba(255,255,255,0.55)',
    buttonBorderColor: 'rgba(255,255,255,0.07)',
};

const EDITOR_OPTIONS = {
    automaticLayout: true,
    selectOnLineNumbers: true,
    readOnly: true,
    minimap: {
        enabled: false,
    },
    wrappingIndent: 'indent',
};

const ExplainOptionIds = {
    schema: 'schema',
    json: 'json',
    ast: 'ast',
};

const explainOptions = [
    {value: ExplainOptionIds.schema, content: 'Schema'},
    {value: ExplainOptionIds.json, content: 'JSON'},
    {value: ExplainOptionIds.ast, content: 'AST'},
];

function GraphRoot(props) {
    const paranoid = useRef();

    const render = () => {
        const {data, opts, shapes, version} = props;

        if (version === explainVersions.v2) {
            paranoid.current = getTopology('graphRoot', data, opts, shapes);
            paranoid.current.render();
        } else if (version === explainVersions.v1) {
            paranoid.current = getCompactTopology('graphRoot', data, opts);
            paranoid.current.renderCompactTopology();
        }
    }

    useEffect(() => {
        render();

        return () => {
            paranoid.current = undefined;
        };
    }, []);

    useEffect(() => {
        const graphRoot = document.getElementById('graphRoot');

        if (!graphRoot) {
            throw new Error("Can't find element with id #graphRoot");
        }

        graphRoot.innerHTML = '';

        render();
    }, [props.opts.colors]);

    useEffect(() => {
        paranoid.current?.updateData?.(props.data);
    }, [props.data]);

    return <div id="graphRoot" style={{height: '100vh'}} />;
}

function QueryExplain(props) {
    const dispatch = useDispatch();
    const [activeOption, setActiveOption] = useState(ExplainOptionIds.schema);

    const isFullscreen = useSelector((state) => state.fullscreen);

    useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, []);

    useEffect(() => {
        if (!props.ast && activeOption === ExplainOptionIds.ast) {
            props.astQuery();
        }
    }, [activeOption]);

    const onSelectOption = (tabId) => {
        setActiveOption(tabId);
    };

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderStub = () => {
        return (
            <div className={b('text-message')}>
                There is no explanation for the request
            </div>
        );
    };

    const hasContent = () => {
        switch (activeOption) {
            case ExplainOptionIds.schema:
                return Boolean(props.explain?.nodes?.length);
            case ExplainOptionIds.json:
                return Boolean(props.explain);
            case ExplainOptionIds.ast:
                return Boolean(props.ast);
            default:
                return false;
        }
    };

    const renderTextExplain = () => {
        const content = (
            <JSONTree
                data={props.explain?.pristine}
                isExpanded={() => true}
                className={b('inspector')}
                searchOptions={{
                    debounceTime: 300,
                }}
            />
        );

        return (
            <React.Fragment>
                {content}
                {isFullscreen && <Fullscreen>{content}</Fullscreen>}
            </React.Fragment>
        );
    };

    const renderAstExplain = () => {
        const content = (
            <div className={b('ast')}>
                <MonacoEditor
                    language={LANGUAGE_S_EXPRESSION_ID}
                    value={props.ast}
                    options={EDITOR_OPTIONS}
                    wrappingIndent="indent"
                />
            </div>
        );
        return (
            <React.Fragment>
                {content}
                {isFullscreen && <Fullscreen>{content}</Fullscreen>}
            </React.Fragment>
        );
    };

    const renderGraph = () => {
        const {explain = {}, theme} = props;
        const {links, nodes, version} = explain;
        const content =
            links && nodes && nodes.length ? (
                <div
                    className={b('explain-canvas-container', {
                        hidden: activeOption !== ExplainOptionIds.schema,
                    })}
                >
                    <GraphRoot
                        version={version}
                        data={{links, nodes}}
                        opts={{
                            renderNodeTitle: renderExplainNode,
                            textOverflow: TextOverflow.Normal,
                            colors: theme === 'dark' ? DARK_COLORS : {},
                            initialZoomFitsCanvas: true,
                        }}
                        shapes={{
                            node: getYdbPlanNodeShape,
                        }}
                    />
                </div>
            ) : null;
        return (
            <React.Fragment>
                {!isFullscreen && content}
                {isFullscreen && <Fullscreen>{content}</Fullscreen>}
            </React.Fragment>
        );
    };

    const renderError = () => {
        const {error} = props;

        let message;

        if (error.data) {
            message = typeof error.data === 'string' ? error.data : error.data.error?.message;
        } else {
            message = error;
        }

        return (
            <div className={b('text-message')}>
                {message}
            </div>
        );
    };

    const renderContent = () => {
        const {error, loading, loadingAst} = props;
        if (loading || loadingAst) {
            return renderLoader();
        }

        if (error) {
            return renderError();
        }

        if (!hasContent()) {
            return renderStub();
        }

        switch (activeOption) {
            case ExplainOptionIds.json: {
                return renderTextExplain();
            }
            case ExplainOptionIds.ast: {
                return renderAstExplain();
            }
            case ExplainOptionIds.schema: {
                return renderGraph();
            }
            default:
                return null;
        }
    };

    return (
        <React.Fragment>
            <div className={b('controls')}>
                {!props.loading && (
                    <React.Fragment>
                        <div className={b('controls-right')}>
                            <QueryExecutionStatus hasError={Boolean(props.error)} />
                            {!props.error && (
                                <React.Fragment>
                                    <Divider />
                                    <RadioButton
                                        options={explainOptions}
                                        value={activeOption}
                                        onUpdate={onSelectOption}
                                    />
                                </React.Fragment>
                            )}
                        </div>
                        <div className={b('controls-left')}>
                            <EnableFullscreenButton disabled={Boolean(props.error)} />
                            <PaneVisibilityToggleButtons
                                onCollapse={props.onCollapseResults}
                                onExpand={props.onExpandResults}
                                isCollapsed={props.isResultsCollapsed}
                                initialDirection="bottom"
                            />
                        </div>
                    </React.Fragment>
                )}
            </div>
            <div className={b('result')}>{renderContent()}</div>
        </React.Fragment>
    );
}

export default QueryExplain;
